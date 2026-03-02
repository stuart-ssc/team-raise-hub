

# Fix: Add Checkout Verification Fallback + Immediate Order Recovery

## Problem
Your order `aee94654` is stuck in `pending` because the Stripe webhook never processed the `checkout.session.completed` event. The webhook is configured correctly for Connected accounts, and the function is deployed and responding -- the most likely cause is a **signing secret mismatch** between Stripe and your `STRIPE_WEBHOOK_SECRET` in Supabase.

## Solution (Two Parts)

### Part 1: Verify & Fix Webhook Secret (Manual - You Do This)
1. Go to your Stripe Dashboard > Developers > Webhooks
2. Click on the webhook endpoint for `https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/stripe-webhook`
3. Click "Reveal" on the signing secret (starts with `whsec_...`)
4. Compare it with the `STRIPE_WEBHOOK_SECRET` value in Supabase Edge Function Secrets
5. If they don't match, update the Supabase secret to match the Stripe signing secret

### Part 2: Build `verify-checkout-session` Edge Function (Automatic Fallback)
Create a new edge function that the success page calls to verify payment directly with Stripe. This prevents future orders from getting stuck even if webhooks fail.

**How it works:**
1. Success page loads with `session_id` in the URL
2. Page calls `verify-checkout-session` with the session ID
3. Function looks up the order by `processor_session_id`
4. If order is already `succeeded`, returns immediately (no double-processing)
5. If order is still `pending`, retrieves the checkout session from Stripe
6. If Stripe says `payment_status === "paid"`, runs the fulfillment logic:
   - Updates order to `succeeded` with customer details
   - Triggers the existing database trigger (`update_donor_profile_from_order`) which handles donor profile creation
   - Calls `send-donation-confirmation` edge function for the email
7. Returns the order status to the frontend

**Key design decision:** The checkout session lives on the platform Stripe account (not the connected account), so we can retrieve it with just the platform secret key -- no connected account header needed.

### Part 3: Update CheckoutSuccess Page
Add a `useEffect` that calls `verify-checkout-session` after the page loads. If the order is still pending, it triggers verification. The page shows a brief "Verifying payment..." indicator during this process, then refreshes the order details once confirmed.

## Files to Create/Edit

| File | Change |
|------|--------|
| `supabase/functions/verify-checkout-session/index.ts` | New edge function - verifies payment with Stripe API and fulfills if needed |
| `supabase/config.toml` | Add `[functions.verify-checkout-session]` with `verify_jwt = false` |
| `src/pages/CheckoutSuccess.tsx` | Add verification call on page load as webhook fallback |

## Immediate Impact
- Stuart's stuck order will be automatically recovered when anyone visits the success page URL
- All future orders will have a safety net regardless of webhook reliability
- No changes to webhook processing -- it will continue to work as primary fulfillment path
