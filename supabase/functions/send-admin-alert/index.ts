import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminAlertRequest {
  functionName: string;
  errorMessage: string;
  severity?: "low" | "medium" | "high" | "critical";
  context?: Record<string, unknown>;
}

const severityColors: Record<string, string> = {
  low: "#3B82F6",
  medium: "#F59E0B",
  high: "#EF4444",
  critical: "#DC2626",
};

const severityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminEmail = Deno.env.get("ADMIN_ALERT_EMAIL");
    if (!adminEmail) {
      console.error("ADMIN_ALERT_EMAIL secret not configured");
      return new Response(
        JSON.stringify({ error: "Admin email not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { functionName, errorMessage, severity = "high", context }: AdminAlertRequest = await req.json();

    const timestamp = new Date().toISOString();
    const logsUrl = `https://supabase.com/dashboard/project/tfrebmhionpuowpzedvz/functions/${functionName}/logs`;
    
    const contextHtml = context 
      ? `
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">Context Details</h3>
          <pre style="margin: 0; font-size: 12px; color: #4B5563; white-space: pre-wrap; word-break: break-word;">${JSON.stringify(context, null, 2)}</pre>
        </div>
      `
      : "";

    console.log(`Sending admin alert for ${functionName}:`, errorMessage);

    const emailResponse = await resend.emails.send({
      from: "Sponsorly Alerts <noreply@sponsorly.io>",
      to: [adminEmail],
      subject: `[${severityLabels[severity]}] Error in ${functionName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: ${severityColors[severity]}; color: white; padding: 15px 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">⚠️ Edge Function Error Alert</h1>
          </div>
          
          <div style="background-color: #ffffff; border: 1px solid #E5E7EB; border-top: none; padding: 25px; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px; width: 120px;">Function:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${functionName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Severity:</td>
                <td style="padding: 8px 0;">
                  <span style="background-color: ${severityColors[severity]}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                    ${severityLabels[severity]}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 14px;">Timestamp:</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${timestamp}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px;">
              <h3 style="margin: 0 0 10px 0; color: #991B1B; font-size: 14px;">Error Message</h3>
              <p style="margin: 0; color: #DC2626; font-size: 14px; font-family: monospace;">${errorMessage}</p>
            </div>
            
            ${contextHtml}
            
            <div style="margin-top: 25px; text-align: center;">
              <a href="${logsUrl}" 
                 style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                View Function Logs
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 25px 0;" />
            
            <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">
              This is an automated alert from Sponsorly. Please investigate promptly.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Admin alert email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending admin alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
