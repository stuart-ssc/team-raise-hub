import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  invitedUserId?: string | null;
  invitedBy?: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let logId: string | null = null;
  let recipientEmail = "";

  try {
    const { email, firstName, lastName, organizationName, roleName, groupName, inviteLink, invitedUserId, invitedBy }: InvitationEmailRequest = await req.json();
    recipientEmail = email.trim().toLowerCase();

    console.log("Sending invitation email to:", email);

    // Pre-insert delivery log row so the Resend webhook can update it later
    try {
      const { data: logRow, error: logErr } = await supabaseAdmin
        .from("email_delivery_log")
        .insert({
          email_type: "invitation",
          recipient_email: recipientEmail,
          recipient_name: `${firstName ?? ""} ${lastName ?? ""}`.trim() || null,
          status: "pending",
          invited_user_id: invitedUserId ?? null,
          metadata: {
            organization_name: organizationName,
            role_name: roleName,
            group_name: groupName ?? null,
            invited_by: invitedBy ?? null,
            subject: `You've been invited to join ${organizationName} on Sponsorly`,
          },
        })
        .select("id")
        .single();
      if (logErr) {
        console.error("Failed to pre-insert email_delivery_log row:", logErr);
      } else {
        logId = logRow?.id ?? null;
      }
    } catch (logCatch) {
      console.error("Exception pre-inserting email_delivery_log row:", logCatch);
    }

    const emailResponse = await resend.emails.send({
      from: "Sponsorly <noreply@sponsorly.io>",
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

    // Capture Resend message id so the webhook can correlate open/click events
    const resendId =
      (emailResponse as any)?.data?.id ?? (emailResponse as any)?.id ?? null;
    if (logId) {
      try {
        await supabaseAdmin
          .from("email_delivery_log")
          .update({
            resend_email_id: resendId,
            status: "sent",
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", logId);
      } catch (updateErr) {
        console.error("Failed to update email_delivery_log after send:", updateErr);
      }
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);

    // Mark log row as failed so admins can see it
    if (logId) {
      try {
        await supabaseAdmin
          .from("email_delivery_log")
          .update({
            status: "failed",
            error_message: (error?.message ?? "Unknown error").slice(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq("id", logId);
      } catch (updateErr) {
        console.error("Failed to mark email_delivery_log as failed:", updateErr);
      }
    }
    
    // Send admin alert for email delivery failures
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-alert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({
          functionName: "send-invitation-email",
          errorMessage: error.message,
          severity: "high",
          context: {
            errorStack: error.stack,
            recipient: recipientEmail,
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
};

serve(handler);
