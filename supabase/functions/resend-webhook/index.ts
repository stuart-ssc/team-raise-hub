import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Webhook } from "https://esm.sh/svix@1.15.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at?: string;
    html?: string;
    text?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      console.error("RESEND_WEBHOOK_SECRET is not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the webhook signature headers
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("Missing required Svix headers");
      return new Response(
        JSON.stringify({ error: "Missing webhook signature headers" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the raw body for signature verification
    const body = await req.text();

    // Verify the webhook signature
    const wh = new Webhook(webhookSecret);
    let event: ResendWebhookEvent;

    try {
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ResendWebhookEvent;
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Received Resend webhook event:", event.type, "for email:", event.data.email_id);

    const emailId = event.data.email_id;
    const timestamp = new Date().toISOString();

    // Update email_delivery_log based on event type
    switch (event.type) {
      case "email.sent":
      case "email.delivered":
        // Update status to sent if not already
        await supabase
          .from("email_delivery_log")
          .update({
            status: "sent",
            sent_at: timestamp,
            updated_at: timestamp,
          })
          .eq("resend_email_id", emailId)
          .is("sent_at", null);
        
        console.log("Updated email as delivered:", emailId);
        break;

      case "email.opened":
        // Record first open time
        await supabase
          .from("email_delivery_log")
          .update({
            opened_at: timestamp,
            updated_at: timestamp,
          })
          .eq("resend_email_id", emailId)
          .is("opened_at", null);
        
        console.log("Recorded email open:", emailId);
        break;

      case "email.clicked":
        // Record first click time
        await supabase
          .from("email_delivery_log")
          .update({
            clicked_at: timestamp,
            updated_at: timestamp,
          })
          .eq("resend_email_id", emailId)
          .is("clicked_at", null);
        
        console.log("Recorded email click:", emailId);
        break;

      case "email.bounced":
      case "email.delivery_delayed":
        // Record bounce
        const bounceReason = (event.data as any).bounce_type || "Unknown bounce reason";
        await supabase
          .from("email_delivery_log")
          .update({
            bounced_at: timestamp,
            status: "failed",
            error_message: `Email bounced: ${bounceReason}`,
            updated_at: timestamp,
          })
          .eq("resend_email_id", emailId);
        
        console.log("Recorded email bounce:", emailId, bounceReason);
        break;

      case "email.complained":
        // Record spam complaint
        await supabase
          .from("email_delivery_log")
          .update({
            status: "failed",
            error_message: "Email marked as spam by recipient",
            updated_at: timestamp,
          })
          .eq("resend_email_id", emailId);
        
        console.log("Recorded spam complaint:", emailId);
        break;

      default:
        console.log("Unhandled webhook event type:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error processing Resend webhook:", error);
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
