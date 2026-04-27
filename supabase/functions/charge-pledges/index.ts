import {
  corsHeaders,
  getStripe,
  getAdminClient,
  resolveStripeAccount,
  buildPledgeChargeParams,
  generateToken,
  type FeeModel,
} from '../_shared/pledge-helpers.ts';

const BATCH_SIZE = 50;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { campaignId } = await req.json();
    if (!campaignId) throw new Error('campaignId required');

    const supabaseAdmin = getAdminClient();
    const stripe = getStripe();

    const { data: campaign, error: cErr } = await supabaseAdmin
      .from('campaigns')
      .select(`
        id, name, fee_model, group_id,
        groups(
          id, organization_id, use_org_payment_account, payment_processor_config,
          organizations(id, name, payment_processor_config)
        )
      `)
      .eq('id', campaignId)
      .single();
    if (cErr || !campaign) throw new Error('Campaign not found');

    const groupData = Array.isArray(campaign.groups) ? campaign.groups[0] : campaign.groups;
    const organizationData = Array.isArray(groupData?.organizations)
      ? groupData?.organizations[0]
      : groupData?.organizations;
    const stripeAccountId = resolveStripeAccount(groupData, organizationData);
    if (!stripeAccountId) throw new Error('Payment account not configured');

    const feeModel: FeeModel = (campaign.fee_model === 'org_absorbs') ? 'org_absorbs' : 'donor_covers';

    // Pull pledge_results that are still pending
    const { data: results, error: rErr } = await supabaseAdmin
      .from('pledge_results')
      .select('*')
      .eq('campaign_id', campaignId)
      .in('charge_status', ['pending', 'processing']);
    if (rErr) throw rErr;

    let processed = 0;

    for (const result of results || []) {
      // Mark processing
      await supabaseAdmin
        .from('pledge_results')
        .update({ charge_status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', result.id);

      // Pull active pledges for this scope
      let pledgeQuery = supabaseAdmin
        .from('pledges')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'active');
      if (result.attributed_roster_member_id) {
        pledgeQuery = pledgeQuery.eq('attributed_roster_member_id', result.attributed_roster_member_id);
      } else {
        pledgeQuery = pledgeQuery.is('attributed_roster_member_id', null);
      }
      const { data: pledges } = await pledgeQuery;

      let charged = 0;
      let failed = 0;
      let amountCharged = 0;

      for (const pledge of pledges || []) {
        if (processed >= BATCH_SIZE) {
          // Self-invoke for next batch and return
          supabaseAdmin.functions.invoke('charge-pledges', {
            body: { campaignId },
          }).catch((e) => console.error('self-invoke failed:', e));
          return new Response(
            JSON.stringify({ ok: true, processed, deferred: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        processed += 1;

        const calculated = Number(pledge.amount_per_unit) * Number(result.units_completed);
        const cap = pledge.max_total_amount != null ? Number(pledge.max_total_amount) : null;
        const finalAmount = cap != null ? Math.min(calculated, cap) : calculated;

        if (finalAmount <= 0) {
          await supabaseAdmin.from('pledges').update({
            status: 'charged',
            units_charged_for: result.units_completed,
            calculated_charge_amount: calculated,
            final_charge_amount: 0,
            charged_at: new Date().toISOString(),
          }).eq('id', pledge.id);
          continue;
        }

        await supabaseAdmin.from('pledges').update({
          status: 'charging',
          units_charged_for: result.units_completed,
          calculated_charge_amount: calculated,
          final_charge_amount: finalAmount,
        }).eq('id', pledge.id);

        const { amountCents, intentParams, platformFeeAmount, donorTotalDollars } =
          buildPledgeChargeParams(finalAmount, feeModel, stripeAccountId);

        try {
          const intent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency: 'usd',
            customer: pledge.stripe_customer_id,
            payment_method: pledge.stripe_payment_method_id,
            confirm: true,
            off_session: true,
            statement_descriptor_suffix: (campaign.name || 'Pledge').substring(0, 22).replace(/[<>"']/g, ''),
            metadata: {
              pledge_id: pledge.id,
              order_id: pledge.order_id,
              campaign_id: campaignId,
              is_pledge: 'true',
              fee_model: feeModel,
            },
            ...intentParams,
          });

          if (intent.status === 'succeeded') {
            await supabaseAdmin.from('pledges').update({
              status: 'charged',
              charged_at: new Date().toISOString(),
            }).eq('id', pledge.id);

            await supabaseAdmin.from('orders').update({
              status: 'succeeded',
              total_amount: donorTotalDollars,
              items_total: finalAmount,
              platform_fee_amount: platformFeeAmount,
              fee_model: feeModel,
              stripe_payment_intent_id: intent.id,
              items: [{
                campaign_item_id: null,
                quantity: result.units_completed,
                price_at_purchase: Number(pledge.amount_per_unit),
                description: `Pledge: ${result.units_completed} × $${Number(pledge.amount_per_unit).toFixed(2)}`,
              }],
              updated_at: new Date().toISOString(),
            }).eq('id', pledge.order_id);

            charged += 1;
            amountCharged += finalAmount;

            try {
              await supabaseAdmin.functions.invoke('send-pledge-charged-receipt', { body: { pledgeId: pledge.id } });
            } catch (e) { console.error('receipt email failed:', e); }
          } else {
            // Unexpected non-succeeded status
            await supabaseAdmin.from('pledges').update({
              status: 'failed',
              charge_failure_reason: `Unexpected PaymentIntent status: ${intent.status}`,
            }).eq('id', pledge.id);
            await supabaseAdmin.from('orders').update({ status: 'pledge_failed' }).eq('id', pledge.order_id);
            failed += 1;
          }
        } catch (err: any) {
          const code = err?.code || err?.raw?.code;
          const msg = err?.message || String(err);
          console.error('Pledge charge failed:', pledge.id, code, msg);

          if (code === 'authentication_required') {
            const scaToken = generateToken(16);
            const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
            await supabaseAdmin.from('pledges').update({
              status: 'requires_action',
              charge_failure_code: code,
              charge_failure_reason: msg,
              sca_confirm_token: scaToken,
              sca_confirm_token_expires_at: expires,
            }).eq('id', pledge.id);

            try {
              await supabaseAdmin.functions.invoke('send-pledge-action-required', { body: { pledgeId: pledge.id } });
            } catch (e) { console.error('action-required email failed:', e); }
            failed += 1;
          } else {
            await supabaseAdmin.from('pledges').update({
              status: 'failed',
              charge_failure_code: code || null,
              charge_failure_reason: msg,
            }).eq('id', pledge.id);
            await supabaseAdmin.from('orders').update({ status: 'pledge_failed' }).eq('id', pledge.order_id);
            try {
              await supabaseAdmin.functions.invoke('send-pledge-charge-failed', { body: { pledgeId: pledge.id } });
            } catch (e) { console.error('failed email failed:', e); }
            failed += 1;
          }
        }
      }

      const totalCount = (pledges?.length || 0);
      const allDone = (charged + failed) >= totalCount;
      await supabaseAdmin.from('pledge_results').update({
        charge_status: allDone ? (failed > 0 ? 'partial_failure' : 'completed') : 'processing',
        total_pledges_count: totalCount,
        total_pledges_charged: charged,
        total_pledges_failed: failed,
        total_amount_charged: amountCharged,
        updated_at: new Date().toISOString(),
      }).eq('id', result.id);
    }

    return new Response(
      JSON.stringify({ ok: true, processed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('charge-pledges error:', error);
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});