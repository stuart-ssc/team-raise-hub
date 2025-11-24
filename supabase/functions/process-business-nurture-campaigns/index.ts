import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NurtureCampaign {
  id: string;
  name: string;
  campaign_type: string;
  trigger_config: any;
  organization_id: string;
}

interface NurtureSequence {
  id: string;
  campaign_id: string;
  sequence_order: number;
  email_template_key: string;
  subject_line: string;
  email_body: string;
  send_delay_days: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting business nurture campaigns processing...");

    // Fetch all active campaigns
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from("business_nurture_campaigns")
      .select("*")
      .eq("status", "active");

    if (campaignsError) {
      throw new Error(`Error fetching campaigns: ${campaignsError.message}`);
    }

    let totalEnrolled = 0;
    let totalEmailsSent = 0;

    // Process each campaign
    for (const campaign of campaigns || []) {
      console.log(`Processing campaign: ${campaign.name}`);

      // Check for new enrollments
      const enrolled = await checkAndEnrollBusinesses(supabaseClient, campaign);
      totalEnrolled += enrolled;

      // Process pending emails
      const emailsSent = await sendPendingEmails(supabaseClient, campaign);
      totalEmailsSent += emailsSent;
    }

    console.log(`Processing complete. Enrolled: ${totalEnrolled}, Emails sent: ${totalEmailsSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        campaigns_processed: campaigns?.length || 0,
        businesses_enrolled: totalEnrolled,
        emails_sent: totalEmailsSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in process-business-nurture-campaigns:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

async function checkAndEnrollBusinesses(
  supabase: any,
  campaign: NurtureCampaign
): Promise<number> {
  let enrolledCount = 0;

  try {
    // Fetch businesses in the outreach queue for this organization
    const { data: queueItems, error: queueError } = await supabase
      .from("business_outreach_queue")
      .select("*, business:businesses(*)")
      .eq("organization_id", campaign.organization_id)
      .is("actioned_at", null);

    if (queueError) {
      console.error("Error fetching queue items:", queueError);
      return 0;
    }

    for (const queueItem of queueItems || []) {
      // Check if business is already enrolled
      const { data: existingEnrollment } = await supabase
        .from("business_nurture_enrollments")
        .select("id")
        .eq("business_id", queueItem.business_id)
        .eq("campaign_id", campaign.id)
        .single();

      if (existingEnrollment) {
        continue; // Already enrolled
      }

      // Check if business matches campaign triggers
      if (matchesTrigger(queueItem, campaign)) {
        // Get first sequence
        const { data: firstSequence, error: seqError } = await supabase
          .from("business_nurture_sequences")
          .select("*")
          .eq("campaign_id", campaign.id)
          .order("sequence_order", { ascending: true })
          .limit(1)
          .single();

        if (seqError || !firstSequence) {
          console.error("No sequences found for campaign:", campaign.id);
          continue;
        }

        // Calculate next send time
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + firstSequence.send_delay_days);

        // Enroll business
        const { error: enrollError } = await supabase
          .from("business_nurture_enrollments")
          .insert({
            business_id: queueItem.business_id,
            campaign_id: campaign.id,
            queue_item_id: queueItem.id,
            current_sequence_id: firstSequence.id,
            status: "active",
            enrolled_at: new Date().toISOString(),
            next_send_at: nextSendAt.toISOString(),
          });

        if (!enrollError) {
          console.log(`Enrolled business ${queueItem.business_id} in campaign ${campaign.name}`);
          enrolledCount++;
        } else {
          console.error("Error enrolling business:", enrollError);
        }
      }
    }
  } catch (error) {
    console.error("Error in checkAndEnrollBusinesses:", error);
  }

  return enrolledCount;
}

function matchesTrigger(queueItem: any, campaign: NurtureCampaign): boolean {
  const config = campaign.trigger_config || {};

  // Check health status
  if (config.health_status && Array.isArray(config.health_status)) {
    if (!config.health_status.includes(queueItem.partnership_health_status)) {
      return false;
    }
  }

  // Check expansion potential
  if (config.expansion_potential && Array.isArray(config.expansion_potential)) {
    if (!config.expansion_potential.includes(queueItem.expansion_potential_level)) {
      return false;
    }
  }

  // Check minimum priority score
  if (config.priority_score_min && queueItem.priority_score < config.priority_score_min) {
    return false;
  }

  // Check days since activity
  if (config.days_since_activity_min && queueItem.business?.last_donor_activity_date) {
    const lastActivity = new Date(queueItem.business.last_donor_activity_date);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince < config.days_since_activity_min) {
      return false;
    }
  }

  return true;
}

async function sendPendingEmails(
  supabase: any,
  campaign: NurtureCampaign
): Promise<number> {
  let emailsSent = 0;

  try {
    // Fetch enrollments that are due to send
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("business_nurture_enrollments")
      .select("*, current_sequence:business_nurture_sequences(*)")
      .eq("campaign_id", campaign.id)
      .eq("status", "active")
      .lte("next_send_at", new Date().toISOString());

    if (enrollmentsError) {
      console.error("Error fetching enrollments:", enrollmentsError);
      return 0;
    }

    for (const enrollment of enrollments || []) {
      try {
        // Send email via send-business-outreach-email function
        const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-business-outreach-email`;
        
        const emailResponse = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            businessId: enrollment.business_id,
            templateKey: enrollment.current_sequence.email_template_key,
            subjectLine: enrollment.current_sequence.subject_line,
            campaignId: campaign.id,
            enrollmentId: enrollment.id,
          }),
        });

        if (!emailResponse.ok) {
          console.error(`Failed to send email for enrollment ${enrollment.id}`);
          continue;
        }

        console.log(`Email sent for enrollment ${enrollment.id}`);
        emailsSent++;

        // Get next sequence
        const { data: nextSequence } = await supabase
          .from("business_nurture_sequences")
          .select("*")
          .eq("campaign_id", campaign.id)
          .gt("sequence_order", enrollment.current_sequence.sequence_order)
          .order("sequence_order", { ascending: true })
          .limit(1)
          .single();

        if (nextSequence) {
          // Advance to next sequence
          const nextSendAt = new Date();
          nextSendAt.setDate(nextSendAt.getDate() + nextSequence.send_delay_days);

          await supabase
            .from("business_nurture_enrollments")
            .update({
              current_sequence_id: nextSequence.id,
              next_send_at: nextSendAt.toISOString(),
            })
            .eq("id", enrollment.id);
        } else {
          // No more sequences, mark as completed
          await supabase
            .from("business_nurture_enrollments")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", enrollment.id);

          console.log(`Enrollment ${enrollment.id} completed`);
        }
      } catch (error) {
        console.error(`Error processing enrollment ${enrollment.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in sendPendingEmails:", error);
  }

  return emailsSent;
}

serve(handler);
