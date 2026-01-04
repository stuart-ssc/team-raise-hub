import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MembershipRequestNotificationRequest {
  organizationId: string;
  requesterName: string;
  requesterEmail: string;
  organizationName: string;
  roleName: string;
  groupName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      organizationId,
      requesterName,
      requesterEmail,
      organizationName,
      roleName,
      groupName,
    }: MembershipRequestNotificationRequest = await req.json();

    console.log("Sending membership request notification:", {
      organizationId,
      requesterName,
      organizationName,
      roleName,
      groupName,
    });

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch organization admins and program managers
    const { data: admins, error: adminsError } = await supabase
      .from("organization_user")
      .select(`
        user_id,
        user_type!inner(permission_level),
        profiles:user_id(email, first_name, last_name)
      `)
      .eq("organization_id", organizationId)
      .in("user_type.permission_level", ["organization_admin", "program_manager"])
      .eq("active_user", true);

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
      throw new Error("Failed to fetch organization admins");
    }

    if (!admins || admins.length === 0) {
      console.log("No admins found for organization:", organizationId);
      return new Response(
        JSON.stringify({ message: "No admins to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the app URL for links
    const appUrl = Deno.env.get("APP_URL") || "https://sponsorly.com";
    const reviewLink = `${appUrl}/dashboard/users?tab=pending`;

    // Send email to each admin
    const emailPromises = admins.map(async (admin: any) => {
      const adminEmail = admin.profiles?.email;
      const adminName = admin.profiles?.first_name || "Admin";

      if (!adminEmail) {
        console.log("Skipping admin without email:", admin.user_id);
        return null;
      }

      console.log("Sending notification to:", adminEmail);

      try {
        const result = await resend.emails.send({
          from: "Sponsorly <notifications@sponsorly.com>",
          to: [adminEmail],
          subject: `New Membership Request for ${organizationName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">New Membership Request</h1>
              
              <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                Hi ${adminName},
              </p>
              
              <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                A new membership request has been submitted for <strong>${organizationName}</strong> on Sponsorly.
              </p>
              
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #333; font-size: 18px; margin-bottom: 15px;">Request Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Requester:</strong></td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${requesterName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Email:</strong></td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${requesterEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Requested Role:</strong></td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${roleName}</td>
                  </tr>
                  ${groupName ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Team/Group:</strong></td>
                    <td style="padding: 8px 0; color: #333; font-size: 14px;">${groupName}</td>
                  </tr>
                  ` : ""}
                </table>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${reviewLink}" 
                   style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Review Request
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                You're receiving this because you're an administrator of ${organizationName}.
              </p>
            </div>
          `,
        });

        console.log("Email sent successfully to:", adminEmail, result);
        return result;
      } catch (emailError) {
        console.error("Error sending email to:", adminEmail, emailError);
        return null;
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r !== null).length;

    console.log(`Sent ${successCount}/${admins.length} notification emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: successCount,
        totalAdmins: admins.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-membership-request-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
