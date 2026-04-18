

## Plan: Per-Campaign Fee Model Toggle

Implementing the spec as written. Summary of work below.

### 1. Database migration
- Add `fee_model TEXT NOT NULL DEFAULT 'donor_covers'` with CHECK constraint to **`campaigns`** table.
- Add `fee_model TEXT NOT NULL DEFAULT 'donor_covers'` with CHECK constraint to **`orders`** table.
- Defaults backfill all existing rows to `donor_covers` → zero behavior change for anything live today.
- Add column comments per spec.

### 2. Edge function: `create-stripe-checkout`
- Add `STRIPE_PERCENT` and `STRIPE_FIXED_CENTS` constants.
- Pull `fee_model` in the campaign select.
- Branch order/fee/line-item logic on `donor_covers` vs `org_absorbs`:
  - **Covers (unchanged):** add Platform Fee line item; `transfer_data.amount` = item total.
  - **Absorbed:** no fee line item; use `application_fee_amount = headlineFee − estimatedStripeFee` (floored at 0); `transfer_data` without `amount`.
- Snapshot `fee_model` onto the order row.
- Add `fee_model` to Stripe payment_intent and session metadata.
- Subscriptions: keep fee line item only in covers mode (already gated by branch); add `fee_model` to subscription metadata.

### 3. Frontend — Campaign Editor
- Add toggle to **`src/components/campaign-editor/DonorExperienceSection.tsx`** (this section already governs what donors see — natural home; alternative would be `BasicDetailsSection`, but Donor Experience is more contextually correct).
- shadcn RadioGroup with two options + helper text exactly as specified.
- Wire `feeModel` through `CampaignEditor.tsx` state → save payload (insert + update).
- Default = `donor_covers` for new campaigns.

### 4. Frontend — Campaign Landing (`src/pages/CampaignLanding.tsx`)
- Include `fee_model` in campaign select.
- `getPlatformFee()` returns 0 when `fee_model === 'org_absorbs'`.
- Conditionally hide the "Platform Fee" cart row in both summary blocks (~line 1019 and ~1269).
- Add small "Includes Sponsorly's 10% platform fee" disclosure under total in absorbed mode.

### 5. Marketing/legal copy updates
- `FAQ.tsx` — soften "100%" line per spec wording.
- `Pricing.tsx` — note absorbed-mode availability per campaign.
- `Terms.tsx` — update three occurrences with the per-campaign-absorption clause.
- `Features.tsx` — softened wording per spec.

### 6. Optional polish
- Show `Fee: Absorbed by org` badge on campaign cards in dashboard list (only in absorbed mode; donor-covers stays unbadged to keep the default uncluttered).

### Out of scope (per spec)
- `stripe-webhook`, `verify-checkout-session`, `create-manual-order` — untouched.
- No data migration for existing orders (default handles it).

### Acceptance check I'll run mentally before finishing
$500 sale in covers → donor pays $550, team nets $500, order row matches.
$500 sale in absorbed → donor pays $500, app_fee=$35.20, team nets ~$450, order row `fee_model='org_absorbs'`.

