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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { campaignSlug, items, customerInfo, attributedRosterMemberId } = await req.json();

    console.log('Creating checkout session for campaign:', campaignSlug);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select(`
        id,
        name,
        group_id,
        groups(organization_id)
      `)
      .eq('slug', campaignSlug)
      .eq('status', true)
      .single();

    if (campaignError) throw new Error('Campaign not found');

    // Validate attributed roster member if provided
    if (attributedRosterMemberId) {
      const { data: rosterMember, error: memberError } = await supabaseClient
        .from('school_user')
        .select('rosters(group_id)')
        .eq('id', attributedRosterMemberId)
        .eq('active_user', true)
        .single();

      if (memberError || (rosterMember as any)?.rosters?.group_id !== campaign.group_id) {
        throw new Error('Invalid roster member for this campaign');
      }
    }

    // Get campaign items with details
    const { data: campaignItems, error: itemsError } = await supabaseClient
      .from('campaign_items')
      .select('*')
      .eq('campaign_id', campaign.id)
      .in('id', items.map((i: any) => i.id));

    if (itemsError) throw itemsError;

    // Calculate total
    let totalAmount = 0;
    const orderItems = items.map((item: any) => {
      const campaignItem = campaignItems?.find(ci => ci.id === item.id);
      if (!campaignItem) throw new Error('Item not found');

      const itemCost = Number(campaignItem.cost || 0);
      const subtotal = itemCost * item.quantity;
      totalAmount += subtotal;

      return {
        campaign_item_id: item.id,
        quantity: item.quantity,
        price_at_purchase: itemCost,
      };
    });

    // Add 10% platform fee
    const platformFee = totalAmount * 0.10;
    const finalTotal = totalAmount + platformFee;

    // Create order record
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        campaign_id: campaign.id,
        total_amount: finalTotal,
        status: 'pending',
        customer_email: customerInfo?.email || 'pending@example.com',
        customer_name: customerInfo?.name || 'Pending',
        attributed_roster_member_id: attributedRosterMemberId || null,
        is_business_purchase: false,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const { error: orderItemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems.map(item => ({
        ...item,
        order_id: order.id,
      })));

    if (orderItemsError) throw orderItemsError;

    // For now, return a mock checkout URL (Stripe integration removed)
    // In production, this would create an actual Stripe session
    const checkoutUrl = `https://sponsorly.io/checkout/${order.id}`;

    console.log('Order created:', order.id);

    return new Response(
      JSON.stringify({
        url: checkoutUrl,
        orderId: order.id,
        sessionId: order.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
