import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

interface BulkEmailRequest {
  businessIds: string[];
  subject: string;
  message: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const resend = new Resend(resendApiKey);

    // Verify the user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { businessIds, subject, message }: BulkEmailRequest = await req.json();

    console.log(`Processing bulk email for ${businessIds.length} businesses`);

    // Fetch businesses with their emails
    const { data: businesses, error: fetchError } = await supabase
      .from("businesses")
      .select("id, business_name, business_email")
      .in("id", businessIds);

    if (fetchError) {
      console.error("Error fetching businesses:", fetchError);
      throw new Error("Failed to fetch business data");
    }

    if (!businesses || businesses.length === 0) {
      throw new Error("No businesses found");
    }

    // Filter businesses that have email addresses
    const businessesWithEmail = businesses.filter(b => b.business_email);
    console.log(`Found ${businessesWithEmail.length} businesses with email addresses`);

    let successCount = 0;
    let errorCount = 0;

    // Send emails to each business
    for (const business of businessesWithEmail) {
      try {
        // Personalize the message
        const personalizedMessage = message.replace(/{businessName}/g, business.business_name || "");

        // Send email via Resend
        const emailResponse = await resend.emails.send({
          from: "Sponsorly <onboarding@resend.dev>",
          to: [business.business_email],
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
                  .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
                  .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
                  .message { white-space: pre-wrap; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2 style="margin: 0; color: #2c3e50;">Partnership Update</h2>
                  </div>
                  <div class="content">
                    <p>Dear ${business.business_name || "Partner"},</p>
                    <div class="message">${personalizedMessage}</div>
                    <p>Thank you for your continued partnership.</p>
                    <p>Best regards,<br>The Sponsorly Team</p>
                  </div>
                  <div class="footer">
                    <p>This email was sent to business partners in our network.</p>
                    <p>If you wish to unsubscribe from future communications, please contact us.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        console.log(`Email sent to ${business.business_email}:`, emailResponse);

        // Log the email delivery
        const { error: logError } = await supabase
          .from("email_delivery_log")
          .insert({
            recipient_email: business.business_email,
            recipient_name: business.business_name,
            email_type: "bulk_business_outreach",
            status: "sent",
            sent_at: new Date().toISOString(),
            resend_email_id: emailResponse.data?.id,
            metadata: {
              subject: subject,
              business_id: business.id,
            },
          });

        if (logError) {
          console.error("Error logging email delivery:", logError);
        }

        successCount++;
      } catch (error) {
        console.error(`Error sending email to ${business.business_email}:`, error);
        errorCount++;

        // Log the failed email attempt
        await supabase
          .from("email_delivery_log")
          .insert({
            recipient_email: business.business_email,
            recipient_name: business.business_name,
            email_type: "bulk_business_outreach",
            status: "failed",
            error_message: error.message,
            metadata: {
              subject: subject,
              business_id: business.id,
            },
          });
      }
    }

    console.log(`Bulk email complete: ${successCount} sent, ${errorCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        queued: successCount,
        failed: errorCount,
        total: businessesWithEmail.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in bulk-email-businesses:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
