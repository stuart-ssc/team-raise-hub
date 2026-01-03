import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageNotificationRequest {
  conversationId: string;
  messageId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { conversationId, messageId }: MessageNotificationRequest = await req.json();

    console.log(`Processing notification for message ${messageId} in conversation ${conversationId}`);

    // Get the message details
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        sender_user_id,
        sender_donor_profile_id,
        sender_type,
        sent_at
      `)
      .eq("id", messageId)
      .single();

    if (msgError || !message) {
      console.error("Error fetching message:", msgError);
      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, subject, conversation_type, organization_id")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      console.error("Error fetching conversation:", convError);
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get sender name
    let senderName = "Someone";
    if (message.sender_user_id) {
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", message.sender_user_id)
        .single();

      if (senderProfile) {
        senderName = `${senderProfile.first_name || ""} ${senderProfile.last_name || ""}`.trim() || "Someone";
      }
    }

    // Get all participants who should receive notifications
    const { data: participants, error: partError } = await supabase
      .from("conversation_participants")
      .select(`
        user_id,
        donor_profile_id,
        participant_type,
        muted_until
      `)
      .eq("conversation_id", conversationId)
      .is("left_at", null);

    if (partError) {
      console.error("Error fetching participants:", partError);
      return new Response(JSON.stringify({ error: "Failed to fetch participants" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let emailsSent = 0;

    // Send email notifications to donors
    for (const participant of participants || []) {
      // Skip the sender
      if (participant.user_id === message.sender_user_id) continue;

      // Skip muted participants
      if (participant.muted_until && new Date(participant.muted_until) > new Date()) continue;

      // Send to donor participants
      if (participant.participant_type === "donor" && participant.donor_profile_id) {
        const { data: donor } = await supabase
          .from("donor_profiles")
          .select("email, first_name, last_name, message_notification_email")
          .eq("id", participant.donor_profile_id)
          .single();

        if (donor && donor.message_notification_email !== false && donor.email) {
          const donorName = `${donor.first_name || ""} ${donor.last_name || ""}`.trim() || "there";
          const subject = conversation.subject 
            ? `New message: ${conversation.subject}`
            : `New message from ${senderName}`;

          try {
            await resend.emails.send({
              from: "Sponsorly <noreply@sponsorly.app>",
              to: [donor.email],
              subject: subject,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">Hi ${donorName},</h2>
                  <p style="color: #444; line-height: 1.6;">You have a new message from <strong>${senderName}</strong>:</p>
                  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p style="color: #333; margin: 0; white-space: pre-wrap;">${message.content.substring(0, 500)}${message.content.length > 500 ? '...' : ''}</p>
                  </div>
                  <p style="color: #666; font-size: 14px;">
                    To reply, please contact the organization directly or use the link provided in your original communication.
                  </p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                  <p style="color: #999; font-size: 12px;">
                    This email was sent by Sponsorly on behalf of the organization. 
                    <a href="https://sponsorly.app" style="color: #666;">Learn more</a>
                  </p>
                </div>
              `,
            });
            emailsSent++;
            console.log(`Email sent to donor: ${donor.email}`);
          } catch (emailError) {
            console.error(`Failed to send email to ${donor.email}:`, emailError);
          }
        }
      }
    }

    console.log(`Notification process complete. Emails sent: ${emailsSent}`);

    return new Response(
      JSON.stringify({ success: true, emailsSent }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-message-notification:", error);
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