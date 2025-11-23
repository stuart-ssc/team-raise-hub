import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  roleName: string;
  groupName?: string;
  inviteLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, organizationName, roleName, groupName, inviteLink }: InvitationEmailRequest = await req.json();

    console.log("Sending invitation email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Sponsorly <onboarding@resend.dev>",
      to: [email],
      subject: `You've been invited to join ${organizationName} on Sponsorly`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to Sponsorly!</h1>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Hi ${firstName},
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            You've been invited to join <strong>${organizationName}</strong> on Sponsorly as a <strong>${roleName}</strong>${groupName ? ` for <strong>${groupName}</strong>` : ''}.
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Sponsorly is a fundraising platform where 100% of donations go directly to your organization. Click the button below to set up your account and get started.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
              Accept Invitation & Set Password
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; line-height: 1.5; margin-top: 30px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #888; font-size: 12px;">
            © ${new Date().getFullYear()} Sponsorly. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
