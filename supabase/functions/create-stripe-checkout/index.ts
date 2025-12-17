import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLATFORM_FEE_PERCENT = 10; // 10% platform fee

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

    // Create admin client early for queries that need to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaignSlug, items, customerInfo, attributedRosterMemberId, origin } = await req.json();

    console.log('Creating checkout session for campaign:', campaignSlug);

    // Get campaign details with organization/group info
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select(`
        id,
        name,
        group_id,
        groups(
          id,
          organization_id,
          use_org_payment_account,
          payment_processor_config,
          organizations(
            id,
            name,
            payment_processor_config
          )
        )
      `)
      .eq('slug', campaignSlug)
      .eq('status', true)
      .single();

    if (campaignError) {
      console.error('Campaign error:', campaignError);
      throw new Error('Campaign not found');
    }

    // Handle groups as array (FK relationships may return arrays)
    const groupData = Array.isArray(campaign.groups) 
      ? campaign.groups[0] 
      : campaign.groups;
    
    const organizationData = Array.isArray(groupData?.organizations)
      ? groupData?.organizations[0]
      : groupData?.organizations;

    console.log('Group data:', JSON.stringify(groupData, null, 2));
    console.log('Organization data:', JSON.stringify(organizationData, null, 2));

    // Determine which Stripe account to use
    let stripeAccountId: string | null = null;
    
    if (groupData?.use_org_payment_account && organizationData?.payment_processor_config?.account_id) {
      stripeAccountId = organizationData.payment_processor_config.account_id;
      console.log('Using organization Stripe account:', stripeAccountId);
    } else if (groupData?.payment_processor_config?.account_id) {
      stripeAccountId = groupData.payment_processor_config.account_id;
      console.log('Using group Stripe account:', stripeAccountId);
    }

    if (!stripeAccountId) {
      console.error('No Stripe account found. Group config:', groupData?.payment_processor_config, 'Org config:', organizationData?.payment_processor_config);
      throw new Error('Payment account not configured for this campaign');
    }

    console.log('Creating Connect checkout with stripeAccountId:', stripeAccountId);

    // Validate attributed roster member if provided (use admin client to bypass RLS on rosters table)
    if (attributedRosterMemberId) {
      const { data: rosterMember, error: memberError } = await supabaseAdmin
        .from('organization_user')
        .select('roster_id, rosters(group_id)')
        .eq('id', attributedRosterMemberId)
        .eq('active_user', true)
        .single();

      console.log('Roster member validation:', { rosterMember, memberError, campaignGroupId: campaign.group_id });

      if (memberError || (rosterMember as any)?.rosters?.group_id !== campaign.group_id) {
        console.error('Roster member validation failed:', memberError || 'Group ID mismatch');
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

    // Build line items for Stripe and calculate totals
    let totalAmount = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderItems = items.map((item: any) => {
      const campaignItem = campaignItems?.find(ci => ci.id === item.id);
      if (!campaignItem) throw new Error('Item not found');

      const itemCost = Number(campaignItem.cost || 0);
      const subtotal = itemCost * item.quantity;
      totalAmount += subtotal;

      // Add to Stripe line items
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: campaignItem.name,
            description: campaignItem.description || undefined,
            images: campaignItem.image ? [campaignItem.image] : undefined,
          },
          unit_amount: Math.round(itemCost * 100), // Convert dollars to cents for Stripe
        },
        quantity: item.quantity,
      });

      return {
        campaign_item_id: item.id,
        quantity: item.quantity,
        price_at_purchase: itemCost,
      };
    });

    // Calculate platform fee (10% of total)
    const platformFeeAmount = Math.round(totalAmount * (PLATFORM_FEE_PERCENT / 100));
    const finalTotal = totalAmount + platformFeeAmount;

    // Add platform fee as line item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Platform Fee',
          description: 'Sponsorly processing and platform fee',
        },
        unit_amount: Math.round(platformFeeAmount * 100), // Convert dollars to cents for Stripe
      },
      quantity: 1,
    });

    // Create order record using admin client
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        campaign_id: campaign.id,
        total_amount: finalTotal,
        platform_fee_amount: platformFeeAmount,
        status: 'pending',
        customer_email: customerInfo?.email || 'pending@example.com',
        customer_name: customerInfo?.name || 'Pending',
        customer_phone: customerInfo?.phone || null,
        attributed_roster_member_id: attributedRosterMemberId || null,
        business_purchase: false,
        items: orderItems,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw orderError;
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Create Stripe Checkout Session
    const baseUrl = origin || 'https://sponsorly.io';
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: customerInfo?.email || undefined,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/c/${campaignSlug}?canceled=true`,
    payment_intent_data: {
        application_fee_amount: Math.round(platformFeeAmount * 100), // Convert dollars to cents for Stripe
        transfer_data: {
          destination: stripeAccountId,
        },
        metadata: {
          order_id: order.id,
          campaign_id: campaign.id,
          campaign_name: campaign.name,
        },
      },
      metadata: {
        order_id: order.id,
        campaign_id: campaign.id,
        attributed_roster_member_id: attributedRosterMemberId || '',
      },
      payment_method_types: ['card', 'us_bank_account'],
    });

    console.log('Checkout session created:', session.id);

    // Update order with Stripe session ID
    await supabaseAdmin
      .from('orders')
      .update({ processor_session_id: session.id })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({
        url: session.url,
        orderId: order.id,
        sessionId: session.id,
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
