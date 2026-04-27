import {
  corsHeaders,
  getStripe,
  getAdminClient,
  resolveStripeAccount,
  buildPledgeChargeParams,
  type FeeModel,
} from '../_shared/pledge-helpers.ts';

/**
 * Public, token-gated. Re-creates a PaymentIntent for a pledge that is in
 * `requires_action` and returns a Stripe-hosted next_action URL the supporter
 * can complete 3DS through. Webhook (payment_intent.succeeded) does the final update.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { pledgeId, token, returnUrl } = await req.json();
    if (!pledgeId || !token) throw new Error('pledgeId and token are required');

    const supabaseAdmin = getAdminClient();
    const stripe = getStripe();

    const { data: pledge, error } = await supabaseAdmin
      .from('pledges')
      .select(`
        id, status, sca_confirm_token, sca_confirm_token_expires_at,
        amount_per_unit, max_total_amount, units_charged_for, final_charge_amount,
        stripe_customer_id, stripe_payment_method_id, order_id, campaign_id,
        campaigns!inner(
          id, name, fee_model, group_id,
          groups(
            id, organization_id, use_org_payment_account, payment_processor_config,
            organizations(id, name, payment_processor_config)
          )
        )
      `)
      .eq('id', pledgeId)
      .maybeSingle();

    if (error || !pledge) throw new Error('Pledge not found');
    if (pledge.sca_confirm_token !== token) throw new Error('Invalid confirm token');
    if (pledge.sca_confirm_token_expires_at && new Date(pledge.sca_confirm_token_expires_at) < new Date()) {
      throw new Error('Confirmation link has expired');
    }
    if (pledge.status !== 'requires_action') {
      throw new Error(`Pledge is not awaiting confirmation (status: ${pledge.status})`);
    }

    const campaign = pledge.campaigns as any;
    const groupData = Array.isArray(campaign.groups) ? campaign.groups[0] : campaign.groups;
    const organizationData = Array.isArray(groupData?.organizations)
      ? groupData?.organizations[0]
      : groupData?.organizations;
    const stripeAccountId = resolveStripeAccount(groupData, organizationData);
    if (!stripeAccountId) throw new Error('Payment account not configured');

    const feeModel: FeeModel = (campaign.fee_model === 'org_absorbs') ? 'org_absorbs' : 'donor_covers';
    const finalAmount = Number(pledge.final_charge_amount || 0);
    if (!(finalAmount > 0)) throw new Error('No charge amount on file for this pledge');

    const { amountCents, intentParams } = buildPledgeChargeParams(finalAmount, feeModel, stripeAccountId);

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: pledge.stripe_customer_id,
      payment_method: pledge.stripe_payment_method_id,
      confirm: true,
      // No off_session — this is supporter-initiated reconfirmation
      use_stripe_sdk: false,
      return_url: returnUrl || 'https://sponsorly.io/pledge/confirm/done',
      statement_descriptor_suffix: (campaign.name || 'Pledge').substring(0, 22).replace(/[<>"']/g, ''),
      metadata: {
        pledge_id: pledge.id,
        order_id: pledge.order_id,
        campaign_id: pledge.campaign_id,
        is_pledge: 'true',
        fee_model: feeModel,
        is_reauth: 'true',
      },
      ...intentParams,
    });

    const redirectUrl = (intent.next_action as any)?.redirect_to_url?.url
      || (intent.next_action as any)?.use_stripe_sdk?.stripe_js
      || null;

    return new Response(
      JSON.stringify({ ok: true, status: intent.status, redirectUrl, paymentIntentId: intent.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('confirm-pledge-payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});