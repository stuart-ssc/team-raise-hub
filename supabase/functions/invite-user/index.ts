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
  schoolId: string;
  groupId: string;
  rosterId: number;
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

    const { email, firstName, lastName, userTypeId, schoolId, groupId, rosterId }: InviteUserRequest = await req.json();

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

    // Check if an inactive school_user record already exists
    const { data: existingSchoolUser, error: checkError } = await supabaseAdmin
      .from("school_user")
      .select("id")
      .eq("user_id", userId)
      .eq("school_id", schoolId)
      .eq("group_id", groupId)
      .eq("active_user", false)
      .single();

    if (existingSchoolUser) {
      // Reactivate the existing inactive record
      const { error: updateError } = await supabaseAdmin
        .from("school_user")
        .update({
          user_type_id: userTypeId,
          roster_id: rosterId,
          active_user: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingSchoolUser.id);

      if (updateError) {
        console.error("Error reactivating school user:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // Create new school_user record
      const { error: schoolUserError } = await supabaseAdmin
        .from("school_user")
        .insert({
          user_id: userId,
          user_type_id: userTypeId,
          school_id: schoolId,
          group_id: groupId,
          roster_id: rosterId
        });

      if (schoolUserError) {
        console.error("Error creating school user:", schoolUserError);
        return new Response(
          JSON.stringify({ error: schoolUserError.message }),
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