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

// Helper to send push notification to a user
async function sendPushNotification(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<{ success: boolean; sent?: number; failed?: number }> {
  const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
  
  if (!fcmServerKey) {
    console.log('FCM_SERVER_KEY not configured, skipping push notification');
    return { success: false };
  }

  // Get user's active device tokens
  const { data: tokens, error: tokenError } = await supabase
    .from('push_notification_tokens')
    .select('device_token, platform')
    .eq('user_id', userId)
    .eq('active', true);

  if (tokenError || !tokens || tokens.length === 0) {
    console.log(`No active device tokens for user ${userId}`);
    return { success: false };
  }

  const deviceTokens = tokens.map((t: any) => t.device_token);

  try {
    // Send to FCM
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`
      },
      body: JSON.stringify({
        registration_ids: deviceTokens,
        notification: {
          title,
          body,
          sound: 'default',
          badge: '1'
        },
        data: data || {},
        priority: 'high'
      })
    });

    const fcmResult = await fcmResponse.json();
    console.log(`Push notification result for user ${userId}:`, fcmResult);

    // Log to database
    await supabase
      .from('push_notification_log')
      .insert({
        user_id: userId,
        title,
        body,
        data,
        tokens_sent: deviceTokens.length,
        success_count: fcmResult.success || 0,
        failure_count: fcmResult.failure || 0,
        fcm_response: fcmResult
      });

    return {
      success: true,
      sent: fcmResult.success || 0,
      failed: fcmResult.failure || 0
    };
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    return { success: false };
  }
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

    // Get sender name based on sender type
    let senderName = "Someone";
    if (message.sender_user_id) {
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", message.sender_user_id)
        .single();

      if (senderProfile) {
        senderName = `${senderProfile.first_name || ""} ${senderProfile.last_name || ""}`.trim() || "Staff member";
      }
    } else if (message.sender_donor_profile_id) {
      const { data: senderDonor } = await supabase
        .from("donor_profiles")
        .select("first_name, last_name, email")
        .eq("id", message.sender_donor_profile_id)
        .single();
      
      if (senderDonor) {
        senderName = `${senderDonor.first_name || ""} ${senderDonor.last_name || ""}`.trim() || senderDonor.email || "A supporter";
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
    let pushSent = 0;
    const portalUrl = "https://sponsorly.app/portal/messages/" + conversationId;
    const dashboardUrl = "https://sponsorly.app/dashboard/messages/" + conversationId;

    // Send email notifications to all participants
    for (const participant of participants || []) {
      // Skip the sender
      if (participant.user_id === message.sender_user_id) continue;
      if (participant.donor_profile_id === message.sender_donor_profile_id) continue;

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
                  <p style="margin: 16px 0;">
                    <a href="${portalUrl}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                      View & Reply
                    </a>
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
      
      // Send to staff/internal participants
      if (participant.participant_type === "internal" && participant.user_id) {
        // Get staff profile with push notification preference
        const { data: staffProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name, notify_messages, push_notify_messages")
          .eq("id", participant.user_id)
          .single();
        
        // Check if staff has message notifications enabled (for email)
        const emailEnabled = staffProfile?.notify_messages !== false;
        // Check if push notifications enabled
        const pushEnabled = staffProfile?.push_notify_messages !== false;
        
        // Get staff email from auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(participant.user_id);
        
        if (authError) {
          console.error(`Failed to get auth user for ${participant.user_id}:`, authError);
          continue;
        }
        
        // Send email notification
        if (emailEnabled && authUser?.user?.email) {
          const staffName = staffProfile?.first_name || "there";
          const subject = conversation.subject 
            ? `New reply: ${conversation.subject}`
            : `New message from ${senderName}`;
          
          try {
            await resend.emails.send({
              from: "Sponsorly <noreply@sponsorly.app>",
              to: [authUser.user.email],
              subject: subject,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">Hi ${staffName},</h2>
                  <p style="color: #444; line-height: 1.6;">You have a new message from <strong>${senderName}</strong>:</p>
                  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p style="color: #333; margin: 0; white-space: pre-wrap;">${message.content.substring(0, 500)}${message.content.length > 500 ? '...' : ''}</p>
                  </div>
                  <p style="margin: 16px 0;">
                    <a href="${dashboardUrl}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                      View Conversation
                    </a>
                  </p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                  <p style="color: #999; font-size: 12px;">
                    This is an automated notification from Sponsorly.
                  </p>
                </div>
              `,
            });
            emailsSent++;
            console.log(`Email sent to staff: ${authUser.user.email}`);
          } catch (emailError) {
            console.error(`Failed to send email to ${authUser.user.email}:`, emailError);
          }
        }
        
        // Send push notification
        if (pushEnabled) {
          const pushTitle = senderName;
          const pushBody = message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '');
          const pushData = {
            type: 'new_message',
            conversationId: conversationId,
            messageId: messageId,
            route: `/dashboard/messages/${conversationId}`
          };
          
          const pushResult = await sendPushNotification(
            supabase,
            participant.user_id,
            pushTitle,
            pushBody,
            pushData
          );
          
          if (pushResult.success && pushResult.sent) {
            pushSent += pushResult.sent;
          }
        }
      }
    }

    console.log(`Notification process complete. Emails sent: ${emailsSent}, Push sent: ${pushSent}`);

    return new Response(
      JSON.stringify({ success: true, emailsSent, pushSent }),
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
