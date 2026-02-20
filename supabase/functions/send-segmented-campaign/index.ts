import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CampaignRequest {
  segmentId?: string;
  listId?: string;
  campaignName: string;
  subjectLine: string;
  emailContent: string;
  filters?: {
    rfm_segment?: string[];
    rfm_recency_score?: { min?: number; max?: number };
    rfm_frequency_score?: { min?: number; max?: number };
    rfm_monetary_score?: { min?: number; max?: number };
    lifetime_value?: { min?: number; max?: number };
    donation_count?: { min?: number; max?: number };
  };
}

interface DonorRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  lifetime_value: number;
  donation_count: number;
  rfm_segment: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { segmentId, listId, campaignName, subjectLine, emailContent, filters }: CampaignRequest = await req.json();

    if (!segmentId && !listId) {
      throw new Error('Either segmentId or listId is required');
    }

    let donors: DonorRow[] = [];
    let organizationId: string | null = null;

    if (listId) {
      // --- List-based campaign ---
      console.log(`Sending list campaign: ${campaignName} to list: ${listId}`);

      const { data: list, error: listError } = await supabaseClient
        .from('donor_lists')
        .select('id, organization_id')
        .eq('id', listId)
        .single();

      if (listError || !list) throw new Error('List not found');
      organizationId = list.organization_id;

      const { data: members, error: membersError } = await supabaseClient
        .from('donor_list_members')
        .select('donor:donor_profiles(id, email, first_name, last_name, lifetime_value, donation_count, rfm_segment)')
        .eq('list_id', listId);

      if (membersError) throw membersError;

      donors = (members || [])
        .map((m: any) => m.donor)
        .filter((d: any) => d && d.email) as DonorRow[];

    } else if (segmentId) {
      // --- Segment-based campaign (existing logic) ---
      console.log(`Sending segmented campaign: ${campaignName} to segment: ${segmentId}`);

      const { data: segment, error: segmentError } = await supabaseClient
        .from('donor_segments')
        .select('*, organization_id')
        .eq('id', segmentId)
        .single();

      if (segmentError || !segment) throw new Error('Segment not found');
      organizationId = segment.organization_id;

      let query = supabaseClient
        .from('donor_profiles')
        .select('id, email, first_name, last_name, lifetime_value, donation_count, rfm_segment, rfm_recency_score, rfm_frequency_score, rfm_monetary_score')
        .eq('organization_id', segment.organization_id);

      const activeFilters = filters || segment.filters;

      if (activeFilters?.rfm_segment?.length > 0) {
        query = query.in('rfm_segment', activeFilters.rfm_segment);
      }
      if (activeFilters?.rfm_recency_score?.min) query = query.gte('rfm_recency_score', activeFilters.rfm_recency_score.min);
      if (activeFilters?.rfm_recency_score?.max) query = query.lte('rfm_recency_score', activeFilters.rfm_recency_score.max);
      if (activeFilters?.rfm_frequency_score?.min) query = query.gte('rfm_frequency_score', activeFilters.rfm_frequency_score.min);
      if (activeFilters?.rfm_frequency_score?.max) query = query.lte('rfm_frequency_score', activeFilters.rfm_frequency_score.max);
      if (activeFilters?.rfm_monetary_score?.min) query = query.gte('rfm_monetary_score', activeFilters.rfm_monetary_score.min);
      if (activeFilters?.rfm_monetary_score?.max) query = query.lte('rfm_monetary_score', activeFilters.rfm_monetary_score.max);
      if (activeFilters?.lifetime_value?.min) query = query.gte('lifetime_value', activeFilters.lifetime_value.min);
      if (activeFilters?.lifetime_value?.max) query = query.lte('lifetime_value', activeFilters.lifetime_value.max);
      if (activeFilters?.donation_count?.min) query = query.gte('donation_count', activeFilters.donation_count.min);
      if (activeFilters?.donation_count?.max) query = query.lte('donation_count', activeFilters.donation_count.max);

      const { data, error: donorsError } = await query;
      if (donorsError) throw donorsError;
      donors = (data || []) as DonorRow[];
    }

    console.log(`Found ${donors.length} donors matching criteria`);

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('donor_segment_campaigns')
      .insert({
        segment_id: segmentId || null,
        list_id: listId || null,
        campaign_name: campaignName,
        subject_line: subjectLine,
        email_content: emailContent,
        sent_count: donors.length,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Send emails using Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const results = await sendEmails(donors, emailContent, subjectLine, RESEND_API_KEY!, campaign.id, segmentId || listId!, supabaseClient);

    const successCount = results.filter(r => r.success).length;
    console.log(`Campaign sent: ${successCount}/${donors.length} emails delivered`);

    return new Response(
      JSON.stringify({
        success: true,
        campaignId: campaign.id,
        totalRecipients: donors.length,
        successfulDeliveries: successCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-segmented-campaign function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

async function sendEmails(
  donors: DonorRow[],
  emailContent: string,
  subjectLine: string,
  resendApiKey: string,
  campaignId: string,
  sourceId: string,
  supabaseClient: any
) {
  const emailPromises = donors.map(async (donor) => {
    const personalizedContent = emailContent
      .replace(/\{firstName\}/g, donor.first_name || '')
      .replace(/\{lastName\}/g, donor.last_name || '')
      .replace(/\{email\}/g, donor.email)
      .replace(/\{lifetimeValue\}/g, `$${(donor.lifetime_value / 100).toFixed(2)}`)
      .replace(/\{donationCount\}/g, donor.donation_count.toString())
      .replace(/\{segment\}/g, donor.rfm_segment || '');

    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Sponsorly <notifications@sponsorly.io>',
          to: [donor.email],
          subject: subjectLine,
          html: personalizedContent,
        }),
      });

      const result = await resendResponse.json();

      await supabaseClient
        .from('email_delivery_log')
        .insert({
          recipient_email: donor.email,
          recipient_name: `${donor.first_name || ''} ${donor.last_name || ''}`.trim(),
          email_type: 'segmented_campaign',
          status: resendResponse.ok ? 'sent' : 'failed',
          resend_email_id: result.id,
          metadata: {
            campaign_id: campaignId,
            source_id: sourceId,
            rfm_segment: donor.rfm_segment
          }
        });

      return { success: resendResponse.ok, email: donor.email };
    } catch (error) {
      console.error(`Failed to send email to ${donor.email}:`, error);
      return { success: false, email: donor.email, error: error.message };
    }
  });

  return Promise.all(emailPromises);
}
