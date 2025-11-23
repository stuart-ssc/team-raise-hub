import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { organizationId } = await req.json();

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    console.log(`Calculating RFM scores for organization: ${organizationId}`);

    // Call the database function to calculate RFM scores
    const { error: functionError } = await supabaseClient.rpc('calculate_rfm_scores', {
      org_id: organizationId
    });

    if (functionError) {
      console.error('Error calculating RFM scores:', functionError);
      throw functionError;
    }

    // Get updated statistics
    const { data: stats, error: statsError } = await supabaseClient
      .from('donor_profiles')
      .select('rfm_segment')
      .eq('organization_id', organizationId);

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      throw statsError;
    }

    const segmentCounts = stats.reduce((acc: Record<string, number>, donor) => {
      acc[donor.rfm_segment] = (acc[donor.rfm_segment] || 0) + 1;
      return acc;
    }, {});

    console.log('RFM scores calculated successfully:', segmentCounts);

    return new Response(
      JSON.stringify({
        success: true,
        totalDonors: stats.length,
        segmentCounts
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in calculate-rfm-scores function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
