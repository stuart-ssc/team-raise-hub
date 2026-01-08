import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HelpNotificationRequest {
  submissionId: string;
  type: "support" | "bug" | "feature";
  subject: string;
  description: string;
  userEmail: string;
  priority: string;
}

const getTypeLabel = (type: string): string => {
  switch (type) {
    case "support": return "Support Request";
    case "bug": return "Bug Report";
    case "feature": return "Feature Suggestion";
    default: return "Help Submission";
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case "support": return "#3b82f6"; // blue
    case "bug": return "#ef4444"; // red
    case "feature": return "#22c55e"; // green
    default: return "#6b7280"; // gray
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case "urgent": return "#ef4444";
    case "high": return "#f97316";
    case "medium": return "#eab308";
    case "low": return "#6b7280";
    default: return "#6b7280";
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, type, subject, description, userEmail, priority }: HelpNotificationRequest = await req.json();

    console.log("Sending help notification for submission:", submissionId, "type:", type);

    const typeLabel = getTypeLabel(type);
    const typeColor = getTypeColor(type);
    const priorityColor = getPriorityColor(priority);

    const emailResponse = await resend.emails.send({
      from: "Sponsorly Support <support@sponsorly.io>",
      to: ["support@sponsorly.io"],
      replyTo: userEmail,
      subject: `[${typeLabel}] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${typeColor}; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 18px;">New ${typeLabel}</h2>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="margin: 8px 0;"><strong>From:</strong> ${userEmail}</p>
            <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
            ${type === "bug" ? `<p style="margin: 8px 0;"><strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${priority.toUpperCase()}</span></p>` : ''}
          </div>
          
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h3 style="color: #374151; margin-top: 0;">Description:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6; background: #f3f4f6; padding: 16px; border-radius: 6px;">${description}</p>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://sponsorly.io/system-admin/help-submissions" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View in Admin Panel
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">
            Submission ID: ${submissionId}
          </p>
        </div>
      `,
    });

    console.log("Help notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-help-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
