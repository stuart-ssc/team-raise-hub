// Shared helpers for the Pledge edge functions.
// Keeps Stripe Connect fee math and account resolution identical to create-stripe-checkout.

import Stripe from 'https://esm.sh/stripe@14.21.0';

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
