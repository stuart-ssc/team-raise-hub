import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReinviteRequest {
  userId: string;
  newEmail?: string;
  organizationId: string;
  firstName: string;
  lastName: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify caller identity
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { userId, newEmail, organizationId, firstName, lastName }: ReinviteRequest = await req.json();

    // Get current user info
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let targetEmail = userData.user.email!;

    // If new email provided, update the user's email
    if (newEmail && newEmail.trim().toLowerCase() !== targetEmail.toLowerCase()) {
      const normalizedNewEmail = newEmail.trim().toLowerCase();
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: normalizedNewEmail,
        email_confirm: false,
      });

      if (updateError) {
        console.error("Error updating user email:", updateError);
        return new Response(JSON.stringify({ error: `Failed to update email: ${updateError.message}` }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      targetEmail = normalizedNewEmail;
      console.log(`Updated user ${userId} email to ${normalizedNewEmail}`);
    }

    // Generate a fresh recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: targetEmail,
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovableproject.com") || "http://localhost:5173"}/login`,
      },
    });

    if (linkError) {
      console.error("Error generating recovery link:", linkError);
      return new Response(JSON.stringify({ error: `Failed to generate invite link: ${linkError.message}` }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get organization name for the email
    const { data: orgData } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    // Send invitation email
    if (linkData?.properties?.action_link) {
      try {
        const inviteResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-invitation-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              email: targetEmail,
              firstName,
              lastName,
              organizationName: orgData?.name || "the organization",
              roleName: "Member",
              inviteLink: linkData.properties.action_link,
            }),
          }
        );

        if (!inviteResponse.ok) {
          const errText = await inviteResponse.text();
          console.error("Error sending invitation email:", errText);
        } else {
          console.log(`Re-invitation email sent to ${targetEmail}`);
        }
      } catch (emailError: any) {
        console.error("Failed to send invitation email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, email: targetEmail }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in reinvite-user:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
