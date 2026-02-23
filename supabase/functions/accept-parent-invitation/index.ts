import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      throw new Error("Missing invitation token");
    }

    console.log(`Processing parent invitation acceptance for user ${user.id}`);

    // Find the invitation by token
    const { data: invitation, error: invitationError } = await supabase
      .from("parent_invitations")
      .select(`
        *,
        inviter:organization_user!inviter_organization_user_id(
          id,
          user_id,
          organization_id,
          group_id,
          roster_id,
          user_type:user_type(name)
        )
      `)
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (invitationError || !invitation) {
      console.error("Invitation not found:", invitationError);
      throw new Error("Invalid or expired invitation");
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from("parent_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);
      throw new Error("This invitation has expired");
    }

    // Check if email matches (optional but recommended)
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      console.log(`Email mismatch: ${user.email} vs ${invitation.email}`);
      // We'll allow it but log it - they might have used a different email to sign up
    }

    // Get the Family Member user type
    const { data: familyMemberType, error: typeError } = await supabase
      .from("user_type")
      .select("id")
      .eq("name", "Family Member")
      .single();

    if (typeError || !familyMemberType) {
      console.error("Family Member user type not found:", typeError);
      throw new Error("Configuration error: Family Member type not found");
    }

    // Check if user already has a Family Member record for this org+group+type
    const targetGroupId = invitation.group_id || invitation.inviter.group_id;
    const { data: existingFamilyMember } = await supabase
      .from("organization_user")
      .select("id, linked_organization_user_id")
      .eq("user_id", user.id)
      .eq("organization_id", invitation.organization_id)
      .eq("group_id", targetGroupId)
      .eq("user_type_id", familyMemberType.id)
      .single();

    let finalOrgUserId: string;

    if (existingFamilyMember) {
      if (existingFamilyMember.linked_organization_user_id === invitation.inviter_organization_user_id) {
        // Already linked to this exact student
        await supabase
          .from("parent_invitations")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
            accepted_by: user.id,
          })
          .eq("id", invitation.id);

        return new Response(
          JSON.stringify({
            success: true,
            message: "You are already connected to this student",
            organizationUserId: existingFamilyMember.id,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // Existing Family Member record with different link — update it
      const { error: updateError } = await supabase
        .from("organization_user")
        .update({
          linked_organization_user_id: invitation.inviter_organization_user_id,
        })
        .eq("id", existingFamilyMember.id);

      if (updateError) {
        console.error("Error updating existing Family Member record:", updateError);
        throw new Error("Failed to link your account");
      }

      finalOrgUserId = existingFamilyMember.id;
      console.log(`Updated existing Family Member record ${existingFamilyMember.id} for user ${user.id}`);
    } else {
      // Always create a NEW Family Member record (even if user has other roles in this group)
      const { data: newOrgUser, error: createError } = await supabase
        .from("organization_user")
        .insert({
          user_id: user.id,
          organization_id: invitation.organization_id,
          group_id: targetGroupId,
          roster_id: invitation.roster_id || invitation.inviter.roster_id,
          user_type_id: familyMemberType.id,
          linked_organization_user_id: invitation.inviter_organization_user_id,
          active_user: true,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating Family Member record:", createError);
        throw new Error("Failed to link your account");
      }

      finalOrgUserId = newOrgUser.id;
      console.log(`Created Family Member record ${newOrgUser.id} for parent ${user.id}`);
    }

    // Update the invitation status
    const { error: updateError } = await supabase
      .from("parent_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Error updating invitation:", updateError);
      // Non-critical, don't throw
    }

    // Optionally send a notification to the player
    // This could be expanded later

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully connected to student",
        organizationUserId: finalOrgUserId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in accept-parent-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
