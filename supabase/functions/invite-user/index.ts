import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  userTypeId: string;
  organizationId: string;
  groupId: string | null;
  rosterId: number | null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, firstName, lastName, userTypeId, organizationId, groupId, rosterId }: InviteUserRequest = await req.json();

    // Check if user already exists in profiles
    const { data: existingProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name")
      .ilike("first_name", firstName.trim())
      .ilike("last_name", lastName.trim());

    let userId: string;

    if (existingProfiles && existingProfiles.length > 0) {
      userId = existingProfiles[0].id;
    } else {
      // Create user using admin client (doesn't affect current session)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false, // Require email confirmation
        user_metadata: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }
      });

      if (authError) {
        console.error("Error creating user:", authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!authData.user) {
        return new Response(
          JSON.stringify({ error: "No user data returned" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userId = authData.user.id;
    }

    // Check if an inactive organization_user record already exists
    const { data: existingOrgUser, error: checkError } = await supabaseAdmin
      .from("organization_user")
      .select("id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("group_id", groupId || null)
      .eq("active_user", false)
      .single();

    if (existingOrgUser) {
      // Reactivate the existing inactive record
      const { error: updateError } = await supabaseAdmin
        .from("organization_user")
        .update({
          user_type_id: userTypeId,
          roster_id: rosterId,
          active_user: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingOrgUser.id);

      if (updateError) {
        console.error("Error reactivating organization user:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // Create new organization_user record
      const { error: orgUserError } = await supabaseAdmin
        .from("organization_user")
        .insert({
          user_id: userId,
          user_type_id: userTypeId,
          organization_id: organizationId,
          group_id: groupId,
          roster_id: rosterId
        });

      if (orgUserError) {
        console.error("Error creating organization user:", orgUserError);
        return new Response(
          JSON.stringify({ error: orgUserError.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Send password reset email which acts as an invitation
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com') || 'http://localhost:5173'}/login`
      }
    });

    if (resetError) {
      console.error("Error sending invitation:", resetError);
      // Don't fail the whole operation if email sending fails
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error in invite-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});