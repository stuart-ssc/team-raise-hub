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
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Extract JWT token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    
    // Create admin client to verify user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError.message);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    if (!user) {
      console.error('No user found from token');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    console.log('Authenticated user:', user.id);

    // Use admin client for database queries (bypasses RLS)
    const supabaseClient = supabaseAdmin;

    const { campaignId, rosterMemberId } = await req.json();

    if (!campaignId || !rosterMemberId) {
      throw new Error('Campaign ID and Roster Member ID are required');
    }

    console.log('Fetching stats for roster member:', rosterMemberId, 'campaign:', campaignId);

    // Refresh materialized view (ignore errors, view might be refreshing already)
    try {
      await supabaseClient.rpc('refresh_roster_fundraising_stats');
    } catch (e) {
      // Ignore refresh errors
    }

    // Get fundraising stats from materialized view
    const { data: stats, error: statsError } = await supabaseClient
      .from('roster_member_fundraising_stats')
      .select('*')
      .eq('roster_member_id', rosterMemberId)
      .eq('campaign_id', campaignId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Stats error:', statsError);
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('name, goal_amount')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Get individual supporters
    const { data: supporters, error: supportersError } = await supabaseClient
      .from('orders')
      .select('customer_name, customer_email, items, created_at')
      .eq('attributed_roster_member_id', rosterMemberId)
      .eq('campaign_id', campaignId)
      .in('status', ['succeeded', 'completed'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (supportersError) throw supportersError;

    // Calculate rank for this campaign
    const { data: allStats } = await supabaseClient
      .from('roster_member_fundraising_stats')
      .select('roster_member_id, total_raised')
      .eq('campaign_id', campaignId)
      .order('total_raised', { ascending: false });

    const rank = (allStats?.findIndex(s => s.roster_member_id === rosterMemberId) ?? -1) + 1;

    // Get personal goal if set (could be added as metadata later)
    const personalGoal = (campaign.goal_amount || 0) / 10; // Default to 10% of campaign goal

    const totalRaised = Number(stats?.total_raised || 0);
    const percentToGoal = personalGoal > 0 ? (totalRaised / personalGoal) * 100 : 0;

    return new Response(
      JSON.stringify({
        totalRaised: totalRaised,
        donationCount: stats?.donation_count || 0,
        avgDonation: Number(stats?.avg_donation || 0),
        uniqueSupporters: stats?.unique_supporters || 0,
        rank: rank || 0,
        totalParticipants: allStats?.length || 0,
        supporters: supporters?.map(s => ({
          name: s.customer_name || s.customer_email,
          email: s.customer_email,
          // Calculate amount from items (price_at_purchase * quantity for each item)
          amount: (s.items as any[])?.reduce((sum: number, item: any) => 
            sum + (item.price_at_purchase || 0) * (item.quantity || 1), 0) || 0,
          date: s.created_at,
        })) || [],
        campaignName: campaign.name,
        personalGoal: personalGoal,
        percentToGoal: Math.min(percentToGoal, 100),
        lastDonationDate: stats?.last_donation_date,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching roster member stats:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
