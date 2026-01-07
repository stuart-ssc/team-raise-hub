import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduledMessage {
  id: string;
  conversation_id: string;
  content: string;
  scheduled_for: string;
  sender_user_id: string;
  sender_donor_profile_id: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing scheduled messages...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all scheduled messages that are due
    const now = new Date().toISOString();
    const { data: messages, error: fetchError } = await supabase
      .from("messages")
      .select("id, conversation_id, content, scheduled_for, sender_user_id, sender_donor_profile_id")
      .eq("status", "scheduled")
      .lte("scheduled_for", now)
      .is("deleted_at", null);

    if (fetchError) {
      console.error("Error fetching scheduled messages:", fetchError);
      throw fetchError;
    }

    if (!messages || messages.length === 0) {
      console.log("No scheduled messages to process");
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${messages.length} scheduled messages to process`);

    let successCount = 0;
    let failCount = 0;

    for (const message of messages as ScheduledMessage[]) {
      try {
        console.log(`Processing message ${message.id} for conversation ${message.conversation_id}`);

        // Update message status to sent
        const { error: updateError } = await supabase
          .from("messages")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", message.id);

        if (updateError) {
          console.error(`Error updating message ${message.id}:`, updateError);
          
          // Mark as failed
          await supabase
            .from("messages")
            .update({ status: "failed" })
            .eq("id", message.id);
          
          failCount++;
          continue;
        }

        // Update conversation's updated_at
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", message.conversation_id);

        // Trigger notification for the sent message
        try {
          const notificationResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-message-notification`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                conversationId: message.conversation_id,
                messageId: message.id,
              }),
            }
          );

          if (!notificationResponse.ok) {
            console.error(
              `Failed to send notification for message ${message.id}:`,
              await notificationResponse.text()
            );
          } else {
            console.log(`Notification sent for message ${message.id}`);
          }
        } catch (notifyError) {
          console.error(`Error sending notification for message ${message.id}:`, notifyError);
          // Don't fail the message just because notification failed
        }

        successCount++;
        console.log(`Successfully processed message ${message.id}`);
      } catch (messageError) {
        console.error(`Error processing message ${message.id}:`, messageError);
        
        // Mark as failed
        await supabase
          .from("messages")
          .update({ status: "failed" })
          .eq("id", message.id);
        
        failCount++;
      }
    }

    console.log(`Processed ${successCount} messages successfully, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-scheduled-messages:", error);
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
