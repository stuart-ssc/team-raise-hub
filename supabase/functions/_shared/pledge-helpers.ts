// Shared helpers for the Pledge edge functions.
// Keeps Stripe Connect fee math and account resolution identical to create-stripe-checkout.

import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const PLATFORM_FEE_PERCENT = 10; // 10% platform fee — same as one-time path
export const STRIPE_PERCENT = 0.029;
export const STRIPE_FIXED_CENTS = 30;

export type FeeModel = 'donor_covers' | 'org_absorbs';

export function buildMandateText(orgName: string, perUnit: number, unitLabel: string, eventDate: string, cap: number | null): string {
  const capStr = cap != null ? `up to $${cap.toFixed(2)}` : 'with no maximum cap';
  return `By submitting, you authorize ${orgName} to charge your card $${perUnit.toFixed(2)} per ${unitLabel} on or after ${eventDate}, ${capStr}. We'll email you a receipt after the charge.`;
}

export function resolveStripeAccount(group: any, organization: any): string | null {
  if (group?.use_org_payment_account && organization?.payment_processor_config?.account_id) {
    return organization.payment_processor_config.account_id;
  }
  if (group?.payment_processor_config?.account_id) {
    return group.payment_processor_config.account_id;
  }
  return null;
}

/**
 * Builds PaymentIntent params for a pledge charge using identical fee math
 * to create-stripe-checkout one-time path.
 *
 * Returns:
 *   amountCents: the cents value to charge the donor
 *   intentParams: partial PaymentIntent params (transfer_data / application_fee_amount)
 *   platformFeeAmount: dollar value of the headline 10% fee
 */
export function buildPledgeChargeParams(
  finalAmountDollars: number,
  feeModel: FeeModel,
  stripeAccountId: string,
) {
  const platformFeeAmount = Math.round(finalAmountDollars * (PLATFORM_FEE_PERCENT / 100));
  const donorTotalDollars = feeModel === 'donor_covers'
    ? finalAmountDollars + platformFeeAmount
    : finalAmountDollars;

  const intentParams: any = {};

  if (feeModel === 'donor_covers') {
    intentParams.transfer_data = {
      destination: stripeAccountId,
      amount: Math.round(finalAmountDollars * 100), // org gets exactly the items value
    };
  } else {
    const finalTotalCents = Math.round(donorTotalDollars * 100);
    const headlineFeeCents = Math.round(platformFeeAmount * 100);
    const estimatedStripeFeeCents = Math.ceil(finalTotalCents * STRIPE_PERCENT) + STRIPE_FIXED_CENTS;
    const applicationFeeCents = Math.max(0, headlineFeeCents - estimatedStripeFeeCents);
    intentParams.application_fee_amount = applicationFeeCents;
    intentParams.transfer_data = { destination: stripeAccountId };
  }

  return {
    amountCents: Math.round(donorTotalDollars * 100),
    donorTotalDollars,
    platformFeeAmount,
    intentParams,
  };
}

export function generateToken(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function getStripe(): Stripe {
  return new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2023-10-16' });
}

export function getAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

/**
 * Idempotently finalize pledge setup. Called from both verify-pledge-setup
 * and the stripe-webhook (mode=setup branch) — they converge on the same state.
 */
export async function finalizePledgeSetup(params: {
  session: any;
  supabaseAdmin: ReturnType<typeof getAdminClient>;
  stripe: Stripe;
}): Promise<{ pledgeId: string | null; alreadyFinalized: boolean }> {
  const { session, supabaseAdmin, stripe } = params;

  const pledgeId = session.metadata?.pledge_id as string | undefined;
  const orderId = session.metadata?.order_id as string | undefined;
  if (!pledgeId || !orderId) {
    console.warn('finalizePledgeSetup: missing pledge_id/order_id in session metadata');
    return { pledgeId: null, alreadyFinalized: false };
  }

  const { data: pledge } = await supabaseAdmin
    .from('pledges')
    .select('id, status, cancel_token')
    .eq('id', pledgeId)
    .maybeSingle();

  if (!pledge) {
    console.warn('finalizePledgeSetup: pledge not found', pledgeId);
    return { pledgeId, alreadyFinalized: false };
  }

  if (pledge.status !== 'pending_setup') {
    console.log('finalizePledgeSetup: already finalized', pledgeId, pledge.status);
    return { pledgeId, alreadyFinalized: true };
  }

  // Pull SetupIntent → payment_method
  const setupIntentId = (typeof session.setup_intent === 'string'
    ? session.setup_intent
    : session.setup_intent?.id) as string | undefined;

  let paymentMethodId: string | null = null;
  let customerId: string | null = (typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id) || null;

  if (setupIntentId) {
    const si = await stripe.setupIntents.retrieve(setupIntentId);
    paymentMethodId = (typeof si.payment_method === 'string'
      ? si.payment_method
      : si.payment_method?.id) || null;
    if (!customerId && si.customer) {
      customerId = typeof si.customer === 'string' ? si.customer : si.customer.id;
    }
  }

  // Generate cancel token (14 days)
  const cancelToken = pledge.cancel_token || generateToken(16);
  const cancelTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

  // Try to link order to existing user by email
  const customerEmail = session.customer_details?.email || session.customer_email || null;
  const customerName = session.customer_details?.name || null;

  let userId: string | null = null;
  if (customerEmail) {
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const matched = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === customerEmail.toLowerCase());
    if (matched) userId = matched.id;
  }

  await supabaseAdmin
    .from('pledges')
    .update({
      status: 'active',
      stripe_setup_intent_id: setupIntentId || null,
      stripe_payment_method_id: paymentMethodId,
      stripe_customer_id: customerId || '',
      cancel_token: cancelToken,
      cancel_token_expires_at: cancelTokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pledgeId);

  await supabaseAdmin
    .from('orders')
    .update({
      customer_email: customerEmail,
      customer_name: customerName,
      user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  // Fire confirmation email (don't block on it)
  try {
    await supabaseAdmin.functions.invoke('send-pledge-confirmation', {
      body: { pledgeId },
    });
  } catch (err) {
    console.error('finalizePledgeSetup: failed to invoke send-pledge-confirmation', err);
  }

  return { pledgeId, alreadyFinalized: false };
}
