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
  linkedOrganizationUserId?: string | null;
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

    const { email, firstName, lastName, userTypeId, organizationId, groupId, rosterId, linkedOrganizationUserId }: InviteUserRequest = await req.json();

    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if user already exists by EMAIL (not name!)
    let userId: string;
    
    const { data: userListData, error: lookupError } = await supabaseAdmin.auth.admin
      .listUsers();

    // Find user by email in the returned list
    const existingUser = userListData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser && !lookupError) {
      // User exists - use their existing ID
      userId = existingUser.id;
      console.log(`Found existing user with email ${normalizedEmail}: ${userId}`);
    } else {
      // Create new user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: false,
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
      console.log(`Created new user with email ${normalizedEmail}: ${userId}`);
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
          linked_organization_user_id: linkedOrganizationUserId,
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
          roster_id: rosterId,
          linked_organization_user_id: linkedOrganizationUserId
        });

      if (orgUserError) {
        console.error("Error creating organization user:", orgUserError);
        return new Response(
          JSON.stringify({ error: orgUserError.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Generate password setup link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com') || 'http://localhost:5173'}/login`
      }
    });

    // Fetch organization and user type details for personalized email
    const { data: orgData } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    const { data: userTypeData } = await supabaseAdmin
      .from("user_type")
      .select("name")
      .eq("id", userTypeId)
      .single();

    const { data: groupData } = groupId ? await supabaseAdmin
      .from("groups")
      .select("group_name")
      .eq("id", groupId)
      .single() : { data: null };

    // Send invitation email via Resend
    if (linkData?.properties?.action_link) {
      try {
        const inviteResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-invitation-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
            },
            body: JSON.stringify({
              email,
              firstName,
              lastName,
              organizationName: orgData?.name || "the organization",
              roleName: userTypeData?.name || "User",
              groupName: groupData?.group_name,
              inviteLink: linkData.properties.action_link
            })
          }
        );

        if (!inviteResponse.ok) {
          console.error("Error sending invitation email:", await inviteResponse.text());
        }
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the whole operation if email sending fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error in invite-user function:", error);
    
    // Send admin alert for user invitation errors
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({
          functionName: "invite-user",
          errorMessage: error.message,
          severity: "high",
          context: {
            errorStack: error.stack
          }
        })
      });
    } catch (alertError) {
      console.error('Failed to send admin alert:', alertError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});