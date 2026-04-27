import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  corsHeaders,
  getStripe,
  resolveStripeAccount,
  buildMandateText,
} from '../_shared/pledge-helpers.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Optional auth — link order to user if signed in
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabaseAdmin.auth.getUser(token);
      userId = data?.user?.id || null;
    }

    const {
      campaignSlug,
      amountPerUnit,
      maxTotalAmount,
      customerInfo,
      attributedRosterMemberId,
      origin,
    } = await req.json();

    if (!campaignSlug || !amountPerUnit || !customerInfo?.email) {
      throw new Error('Missing required fields');
    }

    const perUnit = Number(amountPerUnit);
    if (!(perUnit > 0)) throw new Error('amountPerUnit must be > 0');
    const cap = maxTotalAmount != null && maxTotalAmount !== '' ? Number(maxTotalAmount) : null;
    if (cap != null && !(cap > 0)) throw new Error('maxTotalAmount must be > 0');

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        id, name, group_id, fee_model,
        pledge_unit_label, pledge_unit_label_plural, pledge_scope, pledge_event_date, pledge_min_per_unit,
        groups(
          id, organization_id, use_org_payment_account, payment_processor_config,
          organizations(id, name, payment_processor_config)
        )
      `)
      .eq('slug', campaignSlug)
      .single();
    if (campaignError || !campaign) throw new Error('Campaign not found');

    if (campaign.pledge_min_per_unit != null && perUnit < Number(campaign.pledge_min_per_unit)) {
      throw new Error(`Minimum pledge is $${campaign.pledge_min_per_unit} per ${campaign.pledge_unit_label || 'unit'}`);
    }

    const groupData = Array.isArray(campaign.groups) ? campaign.groups[0] : campaign.groups;
    const organizationData = Array.isArray(groupData?.organizations)
      ? groupData?.organizations[0]
      : groupData?.organizations;

    const stripeAccountId = resolveStripeAccount(groupData, organizationData);
    if (!stripeAccountId) throw new Error('Payment account not configured for this campaign');

    if (campaign.pledge_scope === 'participant' && !attributedRosterMemberId) {
      throw new Error('This pledge campaign requires selecting a participant');
    }

    if (attributedRosterMemberId) {
      const { data: rm } = await supabaseAdmin
        .from('organization_user')
        .select('id, roster_id, rosters(group_id)')
        .eq('id', attributedRosterMemberId)
        .eq('active_user', true)
        .maybeSingle();
      if (!rm || (rm as any).rosters?.group_id !== campaign.group_id) {
        throw new Error('Invalid roster member for this campaign');
      }
    }

    const stripe = getStripe();

    // Create or reuse Stripe Customer on the connected account context
    const customer = await stripe.customers.create({
      email: customerInfo.email,
      name: customerInfo.name,
      phone: customerInfo.phone || undefined,
      metadata: { campaign_id: campaign.id, is_pledge: 'true' },
    });

    const orgName = organizationData?.name || 'the organization';
    const eventDateLabel = campaign.pledge_event_date
      ? new Date(campaign.pledge_event_date as string).toLocaleDateString('en-US', { dateStyle: 'long' })
      : 'the event date';
    const unitLabel = campaign.pledge_unit_label || 'unit';
    const mandateText = buildMandateText(orgName, perUnit, unitLabel, eventDateLabel, cap);

    // Placeholder order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        campaign_id: campaign.id,
        total_amount: 0,
        items_total: 0,
        platform_fee_amount: 0,
        fee_model: campaign.fee_model || 'donor_covers',
        status: 'pledged',
        customer_email: customerInfo.email,
        customer_name: customerInfo.name || null,
        customer_phone: customerInfo.phone || null,
        attributed_roster_member_id: attributedRosterMemberId || null,
        business_purchase: false,
        items: [],
        user_id: userId,
      })
      .select()
      .single();
    if (orderError) throw orderError;

    // Pledge row
    const { data: pledge, error: pledgeError } = await supabaseAdmin
      .from('pledges')
      .insert({
        order_id: order.id,
        campaign_id: campaign.id,
        attributed_roster_member_id: attributedRosterMemberId || null,
        amount_per_unit: perUnit,
        max_total_amount: cap,
        stripe_customer_id: customer.id,
        status: 'pending_setup',
        mandate_text_shown: mandateText,
      })
      .select()
      .single();
    if (pledgeError) throw pledgeError;

    await supabaseAdmin.from('orders').update({ pledge_id: pledge.id }).eq('id', order.id);

    const baseUrl = origin || 'https://sponsorly.io';

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customer.id,
      payment_method_types: ['card'],
      success_url: `${baseUrl}/pledge/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/c/${campaignSlug}?pledge_canceled=true`,
      setup_intent_data: {
        on_behalf_of: stripeAccountId,
        metadata: {
          pledge_id: pledge.id,
          order_id: order.id,
          campaign_id: campaign.id,
          is_pledge: 'true',
        },
      },
      metadata: {
        pledge_id: pledge.id,
        order_id: order.id,
        campaign_id: campaign.id,
        attributed_roster_member_id: attributedRosterMemberId || '',
        is_pledge: 'true',
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, orderId: order.id, pledgeId: pledge.id, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('create-pledge-setup error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});