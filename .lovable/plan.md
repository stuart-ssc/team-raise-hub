

## Goal
Show a real list of added campaign items (name, cost, quantity) inside the Campaign Items card on the AI Campaign Builder preview, instead of whatever placeholder is currently shown.

## Investigation
<lov-tool-use id="toolu_vrtx_014MqhDaDFM7VoqytmXy5t7k" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/ai-campaign/AICampaignPreview.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01AZcFgeWhttSRzVxfxhkHQH" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/ai-campaign/AICampaignPreview.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01EqUcsW31cjpJcy7M6jwXtb" name="code--search_files" integration-id="code" data="{\"query\": \"itemsAdded|campaign_items|items_added\", \"include_patterns\": \"src/pages/AICampaignBuilder.tsx,supabase/functions/ai-campaign-builder/index.ts\"}">
</lov-tool-use>
I have enough context. The Campaign Items card currently just shows a count — we need it to fetch & list the actual items (name, cost, qty) from the database after each item is added.

<lov-plan>

## Goal
Replace the count-only "Campaign Items" card with a real list showing each item's name, cost, and quantity offered.

## Approach
The edge function already inserts into `campaign_items`. We just need the preview to fetch and display them.

### Changes to `src/components/ai-campaign/AICampaignPreview.tsx`
1. Add `useEffect` that queries `campaign_items` (and optionally `campaign_item_variants`) whenever `campaignId` is set or `itemsAdded` changes.
2. Store fetched rows in local state: `{ id, name, cost, quantity_offered, has_variants }`.
3. Render them as a compact list inside the Campaign Items card:
   - Item name (bold, left)
   - `$X.XX` cost · `Qty Y` (right, muted)
   - Empty state preserved when none exist yet
4. Keep the badge with item count in the header.

### Files to change
- `src/components/ai-campaign/AICampaignPreview.tsx` — add fetch + list rendering.

## Out of scope
- No edge function or chat flow changes.
- No edit/delete actions in this card (those live in the full editor).

