import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLATFORM_FEE_PERCENT = 10; // 10% platform fee
const STRIPE_PERCENT = 0.029; // 2.9% Stripe processing
const STRIPE_FIXED_CENTS = 30; // $0.30 fixed Stripe fee per transaction

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

    // Try to get the authenticated user (if logged in)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      userId = userData?.user?.id || null;
      if (userId) {
        console.log('Authenticated user detected:', userId);
      }
    }

    const { campaignSlug, items, customerInfo, attributedRosterMemberId, origin } = await req.json();

    console.log('Creating checkout session for campaign:', campaignSlug);

    // Get campaign details with organization/group info
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select(`
        id,
        name,
        group_id,
        fee_model,
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

    // Check if any items are recurring
    const hasRecurringItems = campaignItems?.some(ci => ci.is_recurring) || false;
    const recurringInterval = campaignItems?.find(ci => ci.is_recurring)?.recurring_interval;

    console.log('Has recurring items:', hasRecurringItems, 'Interval:', recurringInterval);

    // Build line items for Stripe and calculate totals
    let totalAmount = 0;
    const lineItems: any[] = [];
    const orderItems = items.map((item: any) => {
      const campaignItem = campaignItems?.find(ci => ci.id === item.id);
      if (!campaignItem) throw new Error('Item not found');

      const itemCost = Number(campaignItem.cost || 0);
      const subtotal = itemCost * item.quantity;
      totalAmount += subtotal;

      // Build product name - include size if variant
      const productName = item.size 
        ? `${campaignItem.name} (${item.size})`
        : campaignItem.name;

      // Build Stripe line item
      const lineItem: any = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            description: campaignItem.description || undefined,
            images: campaignItem.image ? [campaignItem.image] : undefined,
          },
          unit_amount: Math.round(itemCost * 100), // Convert dollars to cents for Stripe
        },
        quantity: item.quantity,
      };

      // Add recurring config for subscription items
      if (campaignItem.is_recurring && campaignItem.recurring_interval) {
        lineItem.price_data.recurring = {
          interval: campaignItem.recurring_interval, // 'month' or 'year'
        };
      }

      lineItems.push(lineItem);

      return {
        campaign_item_id: item.id,
        variant_id: item.variantId || null,
        size: item.size || null,
        quantity: item.quantity,
        price_at_purchase: itemCost,
        is_recurring: campaignItem.is_recurring || false,
        recurring_interval: campaignItem.recurring_interval,
      };
    });

    // Determine fee model (snapshot from campaign at time of checkout)
    const feeModel: 'donor_covers' | 'org_absorbs' =
      (campaign as any).fee_model === 'org_absorbs' ? 'org_absorbs' : 'donor_covers';
    console.log('Fee model:', feeModel);

    // Calculate platform fee (10% of items total — always the headline fee in dollars)
    const platformFeeAmount = Math.round(totalAmount * (PLATFORM_FEE_PERCENT / 100));

    // finalTotal = what donor actually pays
    // - donor_covers: items + fee
    // - org_absorbs:  items only (fee silently deducted from payout)
    const finalTotal = feeModel === 'donor_covers'
      ? totalAmount + platformFeeAmount
      : totalAmount;

    if (feeModel === 'donor_covers') {
      // Add platform fee as line item so the donor sees it
      const platformFeeLineItem: any = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Platform Fee',
            description: 'Sponsorly processing and platform fee',
          },
          unit_amount: Math.round(platformFeeAmount * 100), // Convert dollars to cents for Stripe
        },
        quantity: 1,
      };

      // For subscriptions, platform fee must also be recurring
      if (hasRecurringItems && recurringInterval) {
        platformFeeLineItem.price_data.recurring = {
          interval: recurringInterval,
        };
      }

      lineItems.push(platformFeeLineItem);
    }
    // org_absorbs: no platform-fee line item — donor only sees the items.

    // Create order record using admin client
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        campaign_id: campaign.id,
        total_amount: finalTotal,
        items_total: totalAmount, // Just the items, excluding platform fee
        platform_fee_amount: platformFeeAmount,
        fee_model: feeModel,
        status: 'pending',
        customer_email: customerInfo?.email || 'pending@example.com',
        customer_name: customerInfo?.name || 'Pending',
        customer_phone: customerInfo?.phone || null,
        attributed_roster_member_id: attributedRosterMemberId || null,
        business_purchase: false,
        items: orderItems,
        user_id: userId,
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

    const baseUrl = origin || 'https://sponsorly.io';

    // Create Stripe Checkout Session
    if (hasRecurringItems) {
      // SUBSCRIPTION MODE
      console.log('Creating subscription checkout session');

      // Create or get a Stripe customer
      let customerId: string | undefined;
      if (customerInfo?.email) {
        const existingCustomers = await stripe.customers.list({
          email: customerInfo.email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
          console.log('Using existing customer:', customerId);
        } else {
          const newCustomer = await stripe.customers.create({
            email: customerInfo.email,
            name: customerInfo.name,
            phone: customerInfo.phone,
            metadata: {
              order_id: order.id,
              campaign_id: campaign.id,
            },
          });
          customerId = newCustomer.id;
          console.log('Created new customer:', customerId);
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: lineItems,
        customer: customerId,
        customer_email: customerId ? undefined : customerInfo?.email,
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/c/${campaignSlug}?canceled=true`,
        subscription_data: {
          application_fee_percent: PLATFORM_FEE_PERCENT,
          transfer_data: {
            destination: stripeAccountId,
          },
          metadata: {
            order_id: order.id,
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            organization_id: organizationData?.id || '',
            group_id: groupData?.id || '',
            attributed_roster_member_id: attributedRosterMemberId || '',
          },
        },
        metadata: {
          order_id: order.id,
          campaign_id: campaign.id,
          attributed_roster_member_id: attributedRosterMemberId || '',
          is_subscription: 'true',
        },
        payment_method_types: ['card'],
      });

      console.log('Subscription checkout session created:', session.id);

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
          isSubscription: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // ONE-TIME PAYMENT MODE
      console.log('Creating one-time payment checkout session');

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        customer_email: customerInfo?.email || undefined,
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/c/${campaignSlug}?canceled=true`,
        payment_intent_data: {
          // Using transfer_data.amount to specify exact org payout (mutually exclusive with application_fee_amount)
          transfer_data: {
            destination: stripeAccountId,
            amount: Math.round(totalAmount * 100), // Org receives exactly the item price, Sponsorly absorbs Stripe fees from platform fee
          },
          transfer_group: `order_${order.id}`, // For refund/dispute correlation
          statement_descriptor_suffix: campaign.name.substring(0, 22).replace(/[<>"']/g, ''), // Max 22 chars, no special chars
          metadata: {
            order_id: order.id,
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            organization_id: organizationData?.id || '',
            group_id: groupData?.id || '',
            platform_fee_cents: Math.round(platformFeeAmount * 100),
            item_total_cents: Math.round(totalAmount * 100),
          },
        },
        metadata: {
          order_id: order.id,
          campaign_id: campaign.id,
          attributed_roster_member_id: attributedRosterMemberId || '',
          is_subscription: 'false',
        },
        payment_method_types: ['card', 'us_bank_account'],
      });

      console.log('Payment checkout session created:', session.id);

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
          isSubscription: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});