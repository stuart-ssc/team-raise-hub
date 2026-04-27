## Pledge Fundraisers — Implementation Plan

A new fundraiser type where supporters commit a rate per unit (e.g. $1/lap) for an upcoming event, save their card via Stripe SetupIntent without being charged, and get charged automatically once the admin records the unit count. Two scopes: **team-wide** and **per-participant** (reuses existing roster attribution).

This plan follows the spec in your uploaded PDF exactly, with two confirmed amendments from your answers:
- **Self-cancel**: include a tokenized "Cancel my pledge" link in the Pledge Received email + a public `cancel-pledge` edge function.
- **SCA reauth**: skip `@stripe/stripe-js`. Use a Stripe-hosted reauth flow (create a hosted Checkout-style confirmation via PaymentIntent `next_action.use_stripe_sdk` redirect, or fall back to a Stripe-hosted payment update link).

---

### What gets built

#### 1. Database migration (one migration file)

- Seed `campaign_type`: `INSERT 'Pledge'` with the spec's description.
- Add columns to `campaigns`:
  `pledge_unit_label`, `pledge_unit_label_plural`, `pledge_scope` (CHECK 'team'|'participant'), `pledge_event_date`, `pledge_min_per_unit`, `pledge_suggested_unit_amounts` JSONB DEFAULT `'[0.50,1,2,5]'::jsonb`.
- Add column to `orders`: `pledge_id` UUID (no FK). Document `status='pledged'` and `'pledge_failed'` are valid (status is free text — no constraint change needed).
- New table **`pledges`** — exact schema from spec (incl. `mandate_text_shown`, `sca_confirm_token`, `sca_confirm_token_expires_at`, status enum). Add **`cancel_token`** + **`cancel_token_expires_at`** (amendment for self-cancel). Indexes on `(campaign_id,status)`, `(attributed_roster_member_id)`, `(order_id)`, `(stripe_setup_intent_id)`, `(cancel_token)`.
- New table **`pledge_results`** — exact schema from spec, with `UNIQUE (campaign_id, attributed_roster_member_id)`.
- RLS:
  - `pledges`: SELECT/INSERT public (matches orders pattern). UPDATE service-role only — except a narrow public UPDATE policy for cancel-by-token via the cancel edge function (which uses service role anyway, so policy is service-only and the function does the work).
  - `pledge_results`: full CRUD limited to roles already used for campaign edits (Principal, Athletic Director, Coach, Club Sponsor, Booster Leader, organization_admin, program_manager) via a join to `organization_user` for the campaign's group.
- `updated_at` triggers on both new tables using existing `update_updated_at_column()`.
- Regenerate `src/integrations/supabase/types.ts` (auto).

#### 2. Edge functions (new — under `supabase/functions/`)

All follow the patterns from `create-stripe-checkout/index.ts` (Stripe v14.21.0 from esm.sh, Deno.serve, CORS preflight, admin client for service-role inserts).

- **`create-pledge-setup`** — Validates campaign + roster member, creates Stripe Customer (`on_behalf_of` connected account), inserts placeholder `orders` row (`status='pledged'`, `total_amount=0`), inserts `pledges` row (`pending_setup`), creates Checkout Session with `mode:'setup'`, `on_behalf_of: stripeAccountId`, metadata `{order_id, pledge_id, campaign_id, is_pledge:'true', attributed_roster_member_id}`. Returns `{url, orderId, pledgeId}`.
- **`verify-pledge-setup`** — Called by `/pledge/success`. Retrieves Checkout Session + SetupIntent, marks pledge `active`, stores `stripe_payment_method_id`, generates `cancel_token`, links order to user (existing pattern), creates donor profile (lift block from `stripe-webhook` lines ~163–219). Invokes `send-pledge-confirmation`. Idempotent.
- **`record-pledge-results`** — JWT-authed. Verifies caller has campaign edit permission via `organization_user`. Upserts `pledge_results` rows. Fire-and-forgets `charge-pledges`. Returns fast.
- **`charge-pledges`** — Iterates active pledges sequentially. Per pledge: compute `final = min(amount_per_unit × units, max_total_amount)`, mark `charging`, build PaymentIntent with **identical fee math** to `create-stripe-checkout` lines 347–389 (`donor_covers` → explicit `transfer_data.amount`; `org_absorbs` → `application_fee_amount = headlineFee - estimatedStripeFee`), `confirm:true`, `off_session:true`, metadata `{pledge_id, is_pledge:'true', order_id, campaign_id}`. Outcomes:
  - success → pledge `charged`, order `succeeded` with totals, fire `send-pledge-charged-receipt` (the existing `sync_campaign_amount_raised` trigger picks it up).
  - decline/generic → pledge `failed`, order `pledge_failed`, fire `send-pledge-charge-failed`.
  - `authentication_required` → pledge `requires_action`, generate `sca_confirm_token` (32-char hex, +14 days), fire `send-pledge-action-required`.
  - Update `pledge_results` totals + `charge_status`. Batch self-invoke in groups of 50 to avoid the 150s timeout.
- **`confirm-pledge-payment`** — Public (token-gated). Validates `pledgeId + confirmToken`. Retrieves the prior PaymentIntent and creates a Stripe-hosted reauth URL (uses `payment_intent.confirm` with `return_url` pointing back to `/pledge/confirm/done`). Returns `{ redirectUrl }` so the page redirects the supporter to Stripe's hosted 3DS flow. Webhook (`payment_intent.succeeded`) then completes the pledge — no client-side stripe.js needed.
- **`cancel-pledge`** *(amendment)* — Public. Validates `pledgeId + cancelToken`, only allowed when status is `active` or `requires_action`. Sets pledge status `canceled`, marks order `canceled`. Returns success.

#### 3. Webhook updates (`stripe-webhook/index.ts`)

- New branch: `checkout.session.completed` with `mode === 'setup'` AND `metadata.is_pledge === 'true'` → call shared helper `finalizePledgeSetup({session, supabaseAdmin, stripe})` (also called by `verify-pledge-setup` for idempotent convergence).
- New branch: `payment_intent.payment_failed` with `metadata.is_pledge === 'true'` → mark pledge `requires_action` or `failed` based on failure code; trigger appropriate email.
- Extend `payment_intent.succeeded`: if `metadata.is_pledge === 'true'` and pledge isn't already `charged`, run the success path (mirror `charge-pledges` success). Idempotency check by pledge status.

#### 4. Email templates (Resend, via `_shared/transactional-email-templates/`)

Built using the existing `send-donation-confirmation` template pattern. Each function takes `{pledgeId}` and pulls campaign/group/org data:

- **`send-pledge-confirmation`** — "Your pledge to [Org] is confirmed." Includes amount/unit, cap, event date, mandate text from `pledges.mandate_text_shown`, link back to campaign, **and a "Cancel pledge" link** at `${origin}/pledge/cancel?pledgeId=X&token=Y`.
- **`send-pledge-charged-receipt`** — Receipt with units, calculation breakdown, last-4 of card (via `stripe.paymentMethods.retrieve`), participant name if applicable, tax-receipt link.
- **`send-pledge-charge-failed`** — Plain-language failure, contact-org instructions.
- **`send-pledge-action-required`** — Link to `${origin}/pledge/confirm?pledgeId=X&token=Y`. Token expires in 14 days.

#### 5. UI: Campaign Editor

- **New file** `src/components/campaign-editor/PledgeSettingsSection.tsx` — Mirrors `ScheduleSection.tsx`. Fields: unit label singular/plural, scope (radio — selecting "Per-participant" auto-sets `enableRosterAttribution=true` with notice), event date, min per unit, suggested per-unit chip editor (defaults `[0.50,1,2,5]`), and an info card explaining the two-phase model.
- **New file** `src/components/campaign-editor/PledgeResultsSection.tsx` — Active-pledges aggregation. Team UI: single number input + "Record Final Results" with confirmation modal requiring **"Type CHARGE to confirm"**. Participant UI: per-roster-member table with unit input per row, estimated charge column, bulk submit. After submit, polls `pledge_results` for live progress + summary (charged/failed/requires_action).
- **Update `CampaignEditor.tsx`**:
  - Add `'pledgeSettings'` and `'pledgeResults'` to `SectionKey` + `SECTION_META` (icons: `HandCoins`, `ClipboardCheck`).
  - Conditionally render these sections only when campaign type name === 'Pledge'.
  - **Hide** `CampaignItemsSection` from nav and rendered sections for Pledge campaigns.
  - Position `pledgeResults` between `Orders` and `Assets` in `CampaignSectionNav`.
  - Add pledge fields to `CampaignData` interface and `saveData` mapping.
- **Update `BasicDetailsSection.tsx`** — When type → "Pledge", auto-suggest `end_date` = `pledge_event_date - 1 day`.

#### 6. UI: Public-facing pledge flow

- **New file** `src/components/campaign-landing/PledgePurchaseFlow.tsx` — 4-step flow inside existing `CampaignLanding` shell:
  1. Scope selector (skipped for team-wide; reuses existing roster picker).
  2. Per-unit amount (suggested chips + custom input) + optional max-cap toggle. Live preview of capped vs uncapped charge.
  3. Donor info (reuses existing form).
  4. Review + mandate text in bordered box. Single button → `create-pledge-setup` → redirect to returned Stripe URL.
- **Update `CampaignLanding.tsx`** — Detect `campaign.campaign_type?.name?.toLowerCase() === 'pledge'` → render `<PledgePurchaseFlow />` instead of cart. Add `'pledge'` case to `getSectionTitle`/`getSectionDescription`.
- **New page** `src/pages/PledgeSuccess.tsx` (route `/pledge/success`) — Reads `session_id`, calls `verify-pledge-setup`, renders `CheckoutSuccess`-styled confirmation emphasizing "Your card hasn't been charged yet — we'll charge it after [event date]."
- **New page** `src/pages/PledgeConfirm.tsx` (route `/pledge/confirm`) — Reads `pledgeId + token`, calls `confirm-pledge-payment` to get a `redirectUrl`, then `window.location = redirectUrl` to send the supporter through Stripe's hosted 3DS flow. After Stripe returns to `/pledge/confirm/done`, show success state (webhook does the actual update).
- **New page** `src/pages/PledgeCancel.tsx` *(amendment)* (route `/pledge/cancel`) — Reads `pledgeId + token`, displays a confirmation screen ("Are you sure you want to cancel your pledge?"), on confirm calls `cancel-pledge` and shows a success screen.
- Register all three routes in `App.tsx`.

#### 7. AI Campaign Builder

- `src/lib/ai/campaignSchema.ts`: include "Pledge" in `campaign_type_id.aiDescription`. Add conditional fields (`pledge_unit_label`, `pledge_unit_label_plural`, `pledge_scope`, `pledge_event_date`) using the existing `dependsOn` pattern keyed off campaign type === Pledge. Keep `goal_amount` required.
- `src/pages/AICampaignBuilder.tsx`: extend the field-collection loop to surface the new conditional fields when type is Pledge.

#### 8. Misc touches

- Add a Pledge chip color/style to `CampaignLanding.tsx` and any other type-branching spots.
- Verify `Campaigns.tsx` dashboard list renders "Pledge" in the type column (data-driven — should just work).

---

### Stripe fee math (must match existing path exactly)

For each pledge charge in `charge-pledges`:
- `donor_covers`: PaymentIntent amount = `(final + 10% fee)` cents; `transfer_data.destination = stripeAccountId`; `transfer_data.amount = final` cents → org receives exactly the items value, Sponsorly absorbs Stripe processing.
- `org_absorbs`: PaymentIntent amount = `final` cents; `application_fee_amount = headlineFee - estimatedStripeFee` cents → org nets ≈ `final - 10%`.

Identical to lines 347–389 of `create-stripe-checkout/index.ts`.

---

### Critical implementation details

- **`on_behalf_of` on the SetupIntent** (not `transfer_data`): the saved payment method must be scoped to the connected account so future destination charges work.
- **Mandate text** stored verbatim in `pledges.mandate_text_shown` for compliance: "By submitting, you authorize [Org Name] to charge your card $[X] per [unit] on or after [event date], up to [cap or 'no cap']."
- **Sequential charging** in `charge-pledges` (no `Promise.all`) — Stripe rate limits + predictable failure handling. Self-invoke for batches > 50.
- **Idempotency everywhere** — `verify-pledge-setup` and the webhook setup branch must converge on the same state. Charging skips if pledge already `charged`.
- **`amount_raised` trigger** fires automatically when pledge orders flip to `succeeded` — do not duplicate.

---

### Out of scope (per your spec)

- Bulk CSV import of pledges
- Partial charges or split payments
- Refund flows (existing refund handling applies once charged)
- Self-service "update card" UI before charge time (failure email instructs supporter to contact the org)

---

### Definition of done

A coach creates a Pledge campaign with participant scope, supporters pledge against specific roster members without being charged, the coach enters unit counts after the event, every supporter is charged in one click, each receives a pledge-received email at pledge time and a charge receipt after, failures produce SCA reauth emails (Stripe-hosted) or failure emails, supporters can self-cancel via email link before charge, and `amount_raised` reflects only charged pledges.

---

### Order of implementation

1. Database migration (tables, RLS, triggers, types regen).
2. Edge functions (5 new + webhook patches + 4 email functions).
3. Editor sections + `CampaignEditor` wiring.
4. Public pledge flow + `CampaignLanding` integration.
5. New pages + routes.
6. AI builder schema updates.
7. End-to-end smoke (using your Stripe test cards: `4242…` for success, `4000 0027 6000 3184` for SCA, `4000 0000 0000 9995` for decline).

Approve and I'll execute the whole change set in one pass.