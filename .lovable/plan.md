## Goal
Allow editors to customize the "Available items" heading and subheading on Merchandise Sales fundraisers, so non-apparel items (raffle tickets, baked goods, etc.) don't display "Pick your size."

## Changes

### 1. Database (migration)
Add two nullable text columns to `campaigns`:
- `merch_items_heading text` (default null)
- `merch_items_subheading text` (default null)

### 2. Campaign Editor (`src/pages/CampaignEditor.tsx`)
- Load these fields from the row into state (alongside other `merch_*` fields).
- Save them on update.
- In the Merchandise editor section (where shipping/pickup fields live), add two inputs:
  - **Items heading** (e.g. "Pick your size.") — short text input
  - **Items subheading** (e.g. "Each item maxes out at the per-person limit shown — kindly leave some for everyone.") — textarea
- Show placeholders matching the current defaults so the user understands what appears if left blank.

### 3. Merchandise landing template (`src/components/campaign-landing/merchandise/MerchandiseLanding.tsx`)
- Replace hardcoded `"Pick your size."` and the subheading sentence with the new fields.
- Fall back to the existing strings when blank so behavior is unchanged for current campaigns.
- Note: `formatHeadline` italicizes the last word — apply the same treatment to the custom heading (italicize the final word) so the visual style stays consistent.

### 4. CampaignLanding data fetch + preview edge function
- Include the two new columns in the campaign select in `src/pages/CampaignLanding.tsx` and `supabase/functions/get-campaign-preview/index.ts` (if they use explicit column lists; otherwise no change).

### 5. AI schema (`src/lib/ai/campaignSchema.ts`)
- Register the two new keys so AI-assisted authoring can suggest values.

## Out of scope
- No changes to other templates (Donation/Pledge/Sponsorship/Event).
- No per-item field renaming (size/color stay as-is on items themselves).