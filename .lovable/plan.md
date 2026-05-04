# Per-Item Sponsorship Items

## Goal

Allow any campaign item (not just items inside a Sponsorship-type campaign) to be marked as a "sponsorship item." When marked:

- The donor must provide business info at checkout (only if their cart contains at least one sponsorship item).
- The item can declare its own required sponsor assets (logo, banner, etc.) that the buyer uploads after purchase.
- Sponsorship-type campaigns auto-treat every item as a sponsorship item (no toggle needed).
- The legacy campaign-level `requires_business_info` toggle is removed from the editor; behavior is derived from items.

## Database Changes

1. **`campaign_items`** — add columns:
   - `is_sponsorship_item boolean not null default false`
   - (no separate column for assets — see below)

2. **`campaign_required_assets`** — add nullable scoping column:
   - `campaign_item_id uuid references campaign_items(id) on delete cascade null`
   - When `null`, asset is campaign-wide (legacy / Sponsorship-type fallback).
   - When set, asset belongs to that specific item.
   - Add index on `campaign_item_id`.
   - RLS already keyed off `campaign_id`; keep that and add equivalent visibility for the item path.

3. **Backfill**: For existing Sponsorship-type campaigns, set `is_sponsorship_item = true` on all their items so behavior is unchanged.

4. **Drop usage of** `campaigns.requires_business_info` going forward (keep column for now to avoid breaking historical reads; stop writing/reading it from new code paths).

## Editor (`/dashboard/fundraisers/:id/edit`)

### `CampaignItemsSection.tsx` (item editor)
- Add a **"Sponsorship item"** toggle on each item row/dialog.
  - Auto-on and disabled (greyed) for Sponsorship-type campaigns ("All items in a sponsorship fundraiser are sponsorship items").
- When toggle is on, render a collapsible **"Required Sponsor Assets"** section using the existing `RequiredAssetsEditor`, scoped to that item.
  - Component gets a new optional `scope: { campaignItemId?: string }` prop and the editor passes through `campaign_item_id` when persisting.

### `DonorExperienceSection.tsx`
- Remove the campaign-level "Requires business info" toggle.
- Replace with a read-only summary: "Business info is collected automatically when a sponsorship item is in the cart. Mark items as sponsorship items in the Items section."

### `CampaignEditor.tsx`
- On save, persist `is_sponsorship_item` per item.
- When loading/saving `campaign_required_assets`, include `campaign_item_id` and group them by item in UI state.
- Stop writing `requires_business_info`.

## Checkout (`CampaignLanding.tsx`)

Replace every `campaign.requires_business_info` check with a derived value:

```ts
const cartHasSponsorshipItem = cart.some(line =>
  items.find(i => i.id === line.itemId)?.is_sponsorship_item
);
const requiresBusinessInfo = cartHasSponsorshipItem;
```

- Use `requiresBusinessInfo` to decide whether the `business-info` step renders and whether the "Skip" path is allowed.
- Pass `requiresBusinessInfo` through to existing landing components (`SponsorshipLanding`, `EventLanding`, `MerchandiseLanding`) instead of the campaign flag.

## Post-purchase asset upload

### `SponsorAssetUpload.tsx`, `PurchaseDetails.tsx`, `CampaignOrderDetail.tsx`
- Determine "this order needs assets" by checking whether any line item in the order has `is_sponsorship_item = true`.
- Fetch `campaign_required_assets` filtered to either:
  - `campaign_item_id IN (sponsorship line items in this order)`, OR
  - `campaign_item_id IS NULL` (campaign-wide legacy assets).
- Group the upload UI by item name when multiple sponsorship items were purchased ("Hole Sponsor — upload sign artwork", "Title Sponsor — upload logo + banner").

## Edge functions

Update logic in:
- `verify-checkout-session/index.ts`
- `stripe-webhook/index.ts`
- `create-manual-order/index.ts`
- `process-checkout-business/index.ts`

Replace the `campaign.requires_business_info || asset_count > 0` heuristic with:

```ts
// 1. Look at order_items -> campaign_items.is_sponsorship_item
// 2. requiresAssets = any sponsorship line item exists AND
//    matching campaign_required_assets rows exist (item-scoped or campaign-wide)
```

Order status logic (pending vs complete) stays the same — just driven by the new per-item check.

## AI builder

`ai-campaign-builder/index.ts` and `campaignSchema.ts`:
- Drop `requires_business_info` from required fields.
- Add an item-level question during the item-collection sub-flow: "Is this a sponsorship item?" — defaults to true for Sponsorship-type campaigns, asked otherwise.
- If yes, run the existing sponsor-assets sub-flow scoped to that item.

## Result

- A single Event campaign (e.g. golf scramble) can sell regular tickets and have a "Hole Sponsor" item that flips on business info collection + per-item asset uploads — no second campaign required.
- Sponsorship-type campaigns behave exactly as today; per-item assets just get scoped automatically.
- Donors only see the business-info step when their cart actually contains a sponsorship item.

## Files touched (summary)

- Migration: add `campaign_items.is_sponsorship_item`, `campaign_required_assets.campaign_item_id`, backfill, index.
- `src/components/campaign-editor/CampaignItemsSection.tsx`
- `src/components/campaign-editor/RequiredAssetsEditor.tsx` (scope prop)
- `src/components/campaign-editor/DonorExperienceSection.tsx`
- `src/pages/CampaignEditor.tsx`
- `src/pages/CampaignLanding.tsx`
- `src/components/campaign-landing/{sponsorship,event,merchandise}/*Landing.tsx`
- `src/pages/DonorPortal/SponsorAssetUpload.tsx`
- `src/pages/DonorPortal/PurchaseDetails.tsx`
- `src/pages/CampaignOrderDetail.tsx`
- `src/pages/CheckoutSuccess.tsx`
- Edge functions listed above
- `src/lib/ai/campaignSchema.ts`, `supabase/functions/ai-campaign-builder/index.ts`
