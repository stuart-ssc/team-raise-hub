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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

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
    const {
      email,
      firstName,
      lastName,
      relationship,
      organizationUserId,
      organizationId,
      groupId,
      rosterId,
    } = body;

    if (!email || !organizationUserId || !organizationId) {
      throw new Error("Missing required fields");
    }

    console.log(`Processing parent invitation from user ${user.id} for ${email}`);

    // Verify the user owns this organization_user record
    const { data: orgUser, error: orgUserError } = await supabase
      .from("organization_user")
      .select("id, user_id, organization_id")
      .eq("id", organizationUserId)
      .eq("user_id", user.id)
      .single();

    if (orgUserError || !orgUser) {
      throw new Error("You don't have permission to send invitations for this account");
    }

    // Check for existing pending invitations to this email from this player
    const { data: existingInvitations } = await supabase
      .from("parent_invitations")
      .select("id")
      .eq("inviter_organization_user_id", organizationUserId)
      .eq("email", email.toLowerCase())
      .eq("status", "pending");

    if (existingInvitations && existingInvitations.length > 0) {
      throw new Error("An invitation is already pending for this email address");
    }

    // Check rate limit (max 5 pending invitations per player)
    const { count } = await supabase
      .from("parent_invitations")
      .select("*", { count: "exact", head: true })
      .eq("inviter_organization_user_id", organizationUserId)
      .eq("status", "pending");

    if (count && count >= 5) {
      throw new Error("You have reached the maximum number of pending invitations (5)");
    }

    // Get the player's name for the email
    const { data: playerProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const playerName = playerProfile
      ? `${playerProfile.first_name || ""} ${playerProfile.last_name || ""}`.trim()
      : "A student";

    // Get the organization name
    const { data: organization } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    const orgName = organization?.name || "the organization";

    // Create the invitation record
    const { data: invitation, error: insertError } = await supabase
      .from("parent_invitations")
      .insert({
        inviter_organization_user_id: organizationUserId,
        email: email.toLowerCase(),
        first_name: firstName || null,
        last_name: lastName || null,
        relationship: relationship || "Guardian",
        organization_id: organizationId,
        group_id: groupId || null,
        roster_id: rosterId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating invitation:", insertError);
      throw new Error("Failed to create invitation");
    }

    console.log(`Created invitation ${invitation.id} with token ${invitation.token}`);

    // Check if the invitee already has an account
    let isExistingUser = false;
    try {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      isExistingUser = users.some(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );
    } catch (err) {
      console.error("Error checking existing user:", err);
    }

    // Send the invitation email
    if (resendApiKey) {
      const baseUrl = req.headers.get("origin") || "https://team-raise-hub.lovable.app";
      const signupUrl = isExistingUser
        ? `${baseUrl}/dashboard?accept-invite=${invitation.token}`
        : `${baseUrl}/signup?invite=${invitation.token}`;

      const ctaText = isExistingUser
        ? "Accept Invitation"
        : "Accept Invitation & Sign Up";
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You've Been Invited!</h2>
          <p>Hi${firstName ? ` ${firstName}` : ""},</p>
          <p><strong>${playerName}</strong> has invited you to join <strong>${orgName}</strong> on Sponsorly as their ${relationship || "parent/guardian"}.</p>
          <p>By joining, you'll be able to:</p>
          <ul>
            <li>Follow their fundraising progress</li>
            <li>Receive updates on campaigns</li>
            <li>Support their activities</li>
          </ul>
          <p style="margin: 30px 0;">
            <a href="${signupUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${ctaText}
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
          <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Sponsorly <noreply@sponsorly.io>",
          to: [email],
          subject: `${playerName} invited you to join ${orgName} on Sponsorly`,
          html: emailHtml,
        }),
      });

      if (!emailRes.ok) {
        console.error("Error sending email:", await emailRes.text());
        // Don't throw - invitation is still created
      } else {
        console.log("Invitation email sent successfully");
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email");
    }

    return new Response(
      JSON.stringify({ success: true, invitationId: invitation.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-parent-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
