import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  donorIds: string[];
  subject: string;
  message: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Escape HTML entities to prevent XSS
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { donorIds, subject, message }: BulkEmailRequest = await req.json();

    if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid donor IDs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: "Subject and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending bulk email to ${donorIds.length} donors`);

    // Fetch donor information
    const { data: donors, error: fetchError } = await supabase
      .from("donor_profiles")
      .select("id, email, first_name, last_name")
      .in("id", donorIds);

    if (fetchError || !donors) {
      throw new Error("Failed to fetch donor information");
    }

    let queued = 0;

    // Send email to each donor
    for (const donor of donors) {
      try {
        // Personalize and escape message to prevent XSS
        const personalizedMessage = message.replace(
          /{firstName}/g,
          escapeHtml(donor.first_name || "Friend")
        );
        const escapedMessage = escapeHtml(personalizedMessage);

        const htmlMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="padding: 20px;">
              ${escapedMessage.split('\n').map(para => `<p>${para}</p>`).join('')}
            </div>
            <div style="padding: 20px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #666;">
              <p>You're receiving this email as a supporter of our organization.</p>
              <p>If you'd like to update your preferences, please contact us.</p>
            </div>
          </div>
        `;

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: "Sponsorly <onboarding@resend.dev>",
          to: [donor.email],
          subject: subject,
          html: htmlMessage,
        });

        if (emailError) {
          console.error(`Error sending email to ${donor.email}:`, emailError);
          continue;
        }

        // Log email delivery
        await supabase.from("email_delivery_log").insert({
          email_type: "bulk_campaign",
          recipient_email: donor.email,
          recipient_name: `${donor.first_name || ""} ${donor.last_name || ""}`.trim(),
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_email_id: emailData?.id || null,
          metadata: {
            subject: subject,
            bulk_campaign: true,
          },
        });

        queued++;
      } catch (error) {
        console.error(`Error processing email for donor ${donor.id}:`, error);
      }
    }

    console.log(`Successfully queued ${queued} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        queued,
        total: donorIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in bulk-email-donors function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
