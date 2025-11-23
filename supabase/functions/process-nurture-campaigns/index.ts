import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NurtureCampaign {
  id: string;
  name: string;
  campaign_type: string;
  trigger_config: {
    inactivity_days?: number;
    milestone_type?: string;
    rfm_segment?: string[];
  };
}

interface DonorProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  lifetime_value: number;
  donation_count: number;
  last_donation_date: string | null;
  first_donation_date: string | null;
  rfm_segment: string | null;
  organization_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    console.log('Processing nurture campaigns...');

    // Get all active campaigns
    const { data: campaigns, error: campaignsError } = await supabaseClient
      .from('nurture_campaigns')
      .select('*')
      .eq('status', 'active');

    if (campaignsError) throw campaignsError;

    console.log(`Found ${campaigns?.length || 0} active campaigns`);

    let totalEnrolled = 0;
    let totalSent = 0;

    // Process each campaign
    for (const campaign of campaigns || []) {
      console.log(`Processing campaign: ${campaign.name} (${campaign.campaign_type})`);

      // Step 1: Check for new enrollments based on triggers
      const newEnrollments = await checkAndEnrollDonors(supabaseClient, campaign);
      totalEnrolled += newEnrollments;

      // Step 2: Send pending emails
      const sentCount = await sendPendingEmails(supabaseClient, campaign);
      totalSent += sentCount;
    }

    console.log(`Campaign processing complete. Enrolled: ${totalEnrolled}, Sent: ${totalSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        campaigns_processed: campaigns?.length || 0,
        donors_enrolled: totalEnrolled,
        emails_sent: totalSent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing nurture campaigns:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function checkAndEnrollDonors(
  supabase: any,
  campaign: NurtureCampaign
): Promise<number> {
  let enrolledCount = 0;

  // Get all donors for this organization
  const { data: allDonors, error: donorsError } = await supabase
    .from('nurture_campaigns')
    .select('organization_id')
    .eq('id', campaign.id)
    .single();

  if (donorsError) throw donorsError;

  const { data: donors, error: donorsFetchError } = await supabase
    .from('donor_profiles')
    .select('*')
    .eq('organization_id', allDonors.organization_id);

  if (donorsFetchError) throw donorsFetchError;

  for (const donor of donors || []) {
    // Check if already enrolled
    const { data: existing } = await supabase
      .from('nurture_enrollments')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('donor_id', donor.id)
      .single();

    if (existing) continue;

    // Check if donor matches campaign trigger
    if (await matchesTrigger(donor, campaign)) {
      // Get first sequence
      const { data: firstSequence } = await supabase
        .from('nurture_sequences')
        .select('delay_hours')
        .eq('campaign_id', campaign.id)
        .eq('sequence_order', 1)
        .single();

      // Enroll donor
      const nextSendAt = new Date();
      nextSendAt.setHours(nextSendAt.getHours() + (firstSequence?.delay_hours || 0));

      const { error: enrollError } = await supabase
        .from('nurture_enrollments')
        .insert({
          campaign_id: campaign.id,
          donor_id: donor.id,
          current_sequence: 1,
          next_send_at: nextSendAt.toISOString(),
          status: 'active',
        });

      if (!enrollError) {
        enrolledCount++;
        console.log(`Enrolled donor ${donor.email} in campaign ${campaign.name}`);
      }
    }
  }

  return enrolledCount;
}

async function matchesTrigger(
  donor: DonorProfile,
  campaign: NurtureCampaign
): Promise<boolean> {
  const now = new Date();

  switch (campaign.campaign_type) {
    case 'welcome':
      // Enroll new donors (first donation within last 24 hours)
      if (donor.first_donation_date) {
        const firstDonation = new Date(donor.first_donation_date);
        const hoursSinceFirst = (now.getTime() - firstDonation.getTime()) / (1000 * 60 * 60);
        return hoursSinceFirst <= 24;
      }
      return false;

    case 'reengagement':
      // Enroll inactive donors
      if (donor.last_donation_date && campaign.trigger_config.inactivity_days) {
        const lastDonation = new Date(donor.last_donation_date);
        const daysSinceLast = (now.getTime() - lastDonation.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLast >= campaign.trigger_config.inactivity_days;
      }
      return false;

    case 'milestone':
      // Enroll donors who match RFM segments
      if (campaign.trigger_config.rfm_segment && donor.rfm_segment) {
        return campaign.trigger_config.rfm_segment.includes(donor.rfm_segment);
      }
      return false;

    default:
      return false;
  }
}

async function sendPendingEmails(
  supabase: any,
  campaign: NurtureCampaign
): Promise<number> {
  let sentCount = 0;

  // Get enrollments ready to send
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('nurture_enrollments')
    .select('*, donor_profiles(*)')
    .eq('campaign_id', campaign.id)
    .eq('status', 'active')
    .lte('next_send_at', new Date().toISOString());

  if (enrollmentsError) throw enrollmentsError;

  console.log(`Found ${enrollments?.length || 0} pending emails for campaign ${campaign.name}`);

  for (const enrollment of enrollments || []) {
    // Get the sequence to send
    const { data: sequence, error: sequenceError } = await supabase
      .from('nurture_sequences')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('sequence_order', enrollment.current_sequence)
      .single();

    if (sequenceError || !sequence) {
      console.error(`Sequence ${enrollment.current_sequence} not found for campaign ${campaign.id}`);
      continue;
    }

    // Send email
    const donor = enrollment.donor_profiles;
    const personalizedContent = personalizeContent(sequence.email_content, donor);

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Sponsorly <notifications@sponsorly.io>',
          to: [donor.email],
          subject: sequence.subject_line,
          html: personalizedContent,
        }),
      });

      const result = await resendResponse.json();

      // Log email delivery
      await supabase.from('email_delivery_log').insert({
        recipient_email: donor.email,
        recipient_name: `${donor.first_name || ''} ${donor.last_name || ''}`.trim(),
        email_type: 'nurture_campaign',
        status: resendResponse.ok ? 'sent' : 'failed',
        resend_email_id: result.id,
        metadata: {
          campaign_id: campaign.id,
          enrollment_id: enrollment.id,
          sequence_order: enrollment.current_sequence,
        },
      });

      if (resendResponse.ok) {
        sentCount++;

        // Update enrollment for next sequence
        const { data: nextSequence } = await supabase
          .from('nurture_sequences')
          .select('delay_hours')
          .eq('campaign_id', campaign.id)
          .eq('sequence_order', enrollment.current_sequence + 1)
          .single();

        if (nextSequence) {
          // More sequences to send
          const nextSendAt = new Date();
          nextSendAt.setHours(nextSendAt.getHours() + nextSequence.delay_hours);

          await supabase
            .from('nurture_enrollments')
            .update({
              current_sequence: enrollment.current_sequence + 1,
              next_send_at: nextSendAt.toISOString(),
            })
            .eq('id', enrollment.id);
        } else {
          // Campaign complete
          await supabase
            .from('nurture_enrollments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', enrollment.id);
        }
      }
    } catch (error) {
      console.error(`Failed to send email to ${donor.email}:`, error);
    }
  }

  return sentCount;
}

function personalizeContent(content: string, donor: DonorProfile): string {
  return content
    .replace(/\{firstName\}/g, donor.first_name || 'Friend')
    .replace(/\{lastName\}/g, donor.last_name || '')
    .replace(/\{email\}/g, donor.email)
    .replace(/\{lifetimeValue\}/g, `$${(donor.lifetime_value / 100).toFixed(2)}`)
    .replace(/\{donationCount\}/g, donor.donation_count.toString())
    .replace(/\{segment\}/g, donor.rfm_segment || 'supporter');
}
