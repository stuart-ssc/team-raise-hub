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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { organizationId } = await req.json();

    if (!organizationId) {
      throw new Error('Organization ID is required');
    }

    console.log(`Calculating business engagement scores for organization: ${organizationId}`);

    // Verify user belongs to organization
    const { data: orgUser, error: orgError } = await supabaseClient
      .from('organization_user')
      .select('id, user_type_id, user_type(permission_level)')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (orgError || !orgUser) {
      throw new Error('User does not belong to this organization');
    }

    // Call the database function
    const { error: functionError } = await supabaseClient.rpc(
      'calculate_business_engagement_scores',
      { org_id: organizationId }
    );

    if (functionError) {
      console.error('Error calculating scores:', functionError);
      throw functionError;
    }

    // Get updated statistics
    const { data: stats, error: statsError } = await supabaseClient
      .from('businesses')
      .select('engagement_segment, engagement_score, linked_donors_count, total_partnership_value')
      .in('id', 
        supabaseClient
          .from('organization_businesses')
          .select('business_id')
          .eq('organization_id', organizationId)
      );

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      throw statsError;
    }

    const segmentCounts = (stats || []).reduce((acc: Record<string, number>, business: any) => {
      acc[business.engagement_segment] = (acc[business.engagement_segment] || 0) + 1;
      return acc;
    }, {});

    const totalPartnershipValue = (stats || []).reduce((sum, b) => sum + (b.total_partnership_value || 0), 0);
    const totalLinkedDonors = (stats || []).reduce((sum, b) => sum + (b.linked_donors_count || 0), 0);

    console.log('Engagement scores calculated successfully:', segmentCounts);

    return new Response(
      JSON.stringify({
        success: true,
        totalBusinesses: stats?.length || 0,
        segmentCounts,
        totalPartnershipValue,
        totalLinkedDonors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in calculate-business-engagement:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
