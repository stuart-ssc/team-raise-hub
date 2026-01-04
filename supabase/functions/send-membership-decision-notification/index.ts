import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MembershipDecisionRequest {
  userId: string;
  organizationName: string;
  decision: "approved" | "rejected";
  roleName: string;
  groupName?: string;
  reviewerNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userId, 
      organizationName, 
      decision, 
      roleName, 
      groupName,
      reviewerNotes 
    }: MembershipDecisionRequest = await req.json();

    console.log(`Processing membership decision notification for user ${userId}, decision: ${decision}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    // Get user email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser?.user?.email) {
      console.error("Error fetching user email:", authError);
      throw new Error("Failed to fetch user email");
    }

    const userEmail = authUser.user.email;
    const firstName = profile?.first_name || "there";
    const appUrl = Deno.env.get("APP_URL") || "https://sponsorly.com";

    let subject: string;
    let htmlContent: string;

    if (decision === "approved") {
      subject = `Welcome to ${organizationName}!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 You're In!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Great news! Your request to join <strong>${organizationName}</strong> as a <strong>${roleName}</strong>${groupName ? ` in ${groupName}` : ''} has been <span style="color: #10b981; font-weight: bold;">approved</span>!
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                You now have full access to the organization's features and can start participating right away.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/dashboard" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Go to Dashboard
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Welcome to the team!<br>
                The Sponsorly Team
              </p>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = `Update on your request to join ${organizationName}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Membership Request Update</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for your interest in joining <strong>${organizationName}</strong> as a <strong>${roleName}</strong>${groupName ? ` in ${groupName}` : ''}.
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Unfortunately, your request was not approved at this time.
              </p>
              ${reviewerNotes ? `
                <div style="background: white; border-left: 4px solid #6b7280; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="font-size: 14px; color: #6b7280; margin: 0 0 5px 0; font-weight: 600;">Note from the reviewer:</p>
                  <p style="font-size: 14px; color: #374151; margin: 0;">${reviewerNotes}</p>
                </div>
              ` : ''}
              <p style="font-size: 16px; margin-bottom: 20px;">
                If you believe this was a mistake or have questions, please reach out directly to the organization.
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Best regards,<br>
                The Sponsorly Team
              </p>
            </div>
          </body>
        </html>
      `;
    }

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Sponsorly <notifications@sponsorly.com>",
      to: [userEmail],
      subject,
      html: htmlContent,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log(`Successfully sent ${decision} notification email to ${userEmail}`, emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-membership-decision-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
