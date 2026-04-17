

## Goal
In the AI Campaign Assistant, when collecting campaign items, give the user a chance to upload an image for each item (with a Skip option), similar to how the campaign-level image upload works.

## Investigation
- `src/components/ai-campaign/AIChatPanel.tsx` already supports a `suggestions.type === "image_upload"` prompt that renders `ImageUploadPrompt`. Currently used only for the campaign hero image (uploads to a campaign).
- `src/components/ai-campaign/ImageUploadPrompt.tsx` (need to confirm signature) — accepts `campaignId`, calls `onUploaded(url)` and `onSkip()`. Likely uploads into a campaign-image bucket using `campaignId` as the path prefix.
- `src/pages/AICampaignBuilder.tsx` wires `handleImageUploaded` / `handleImageSkipped` into the AI flow by sending a synthetic user message ("Image uploaded: <url>" / "Skip image for now") and merging fields into `collectedFields` (`image_url`, `image_skipped`).
- Items collection state on the page: `currentItemDraft`, `itemsAdded`, `awaitingAddAnother`, `itemNoun`, `phase: "collecting_items"`. The edge function `supabase/functions/ai-campaign-builder/index.ts` returns `savedItemId` when an item is persisted and drives `currentItemDraft`.

## Investigation needed before coding
1. Read `ImageUploadPrompt.tsx` to confirm props, bucket, and path layout (does it require a campaignId, and where does it write?).
2. Read `ai-campaign-builder/index.ts` to find:
   - Where item fields are collected and validated
   - Whether `image_url` is already a recognized item field on the item schema/tool call
   - The exact tool/function used to save an item (`save_campaign_item`?) and whether it accepts an `image_url`
   - Where it emits the `image_upload` suggestion type so we can replicate for items
3. Confirm the `campaign_items` table (or wherever items are saved) has an `image_url` column. If not, a migration will be needed.

## Plan

### 1. Frontend — `AICampaignBuilder.tsx`
- Add new state for the in-flight item image: track an `itemImageUrl` (and `itemImageSkipped`) on `currentItemDraft` via merged fields.
- Add two handlers mirroring the campaign image ones, but scoped to items:
  - `handleItemImageUploaded(url)` → merge `{ image_url: url }` into `currentItemDraft` locally, push synthetic user message `"Item image uploaded: <url>"`, call AI with updated draft.
  - `handleItemImageSkipped()` → merge `{ image_skipped: true }` into `currentItemDraft`, push `"Skip item image"`, call AI.
- Pass the draft state through `callAi` (already happens via `currentItemDraft`).
- Distinguish prompt context: extend the `suggestions` payload from the edge function with an optional `field` of `"item_image_url"` so the page can route the upload to the right handler.

### 2. Frontend — `AIChatPanel.tsx`
- The component already renders `ImageUploadPrompt` when `suggestions.type === "image_upload"`. Add a callback distinction: pass through `suggestions.field` so the parent decides whether to call `onImageUploaded` (campaign) or `onItemImageUploaded` (item).
- Add new optional props: `onItemImageUploaded`, `onItemImageSkipped`. When the suggestion's `field === "item_image_url"`, route `ImageUploadPrompt` events to those instead.

### 3. Frontend — `ImageUploadPrompt.tsx`
- Confirm it accepts a generic upload context. If it currently hardcodes a campaign-image path, add an optional `pathPrefix` or `kind: "campaign" | "item"` prop so item images are stored under a distinct prefix (e.g. `campaign-item-images/{campaignId}/items/{uuid}.{ext}`).
- Keep Skip behavior identical.

### 4. Edge function — `supabase/functions/ai-campaign-builder/index.ts`
- In the items-collection phase, after the AI has captured the item's name and price (or whichever fields are required first), emit an `image_upload` suggestion with `field: "item_image_url"` and a label like "Item image" before saving the item.
- When the next user turn arrives with `currentItemDraft.image_url` set OR `currentItemDraft.image_skipped === true`, proceed to save the item via the existing tool call, including `image_url` in the payload when present.
- Reset `image_url` / `image_skipped` from the draft after the item is saved so the next item starts clean.

### 5. Database (only if needed)
- If `campaign_items` (or equivalent table the function writes to) lacks an `image_url` column, add a migration: `ALTER TABLE campaign_items ADD COLUMN image_url text;`. Will confirm during implementation.

### 6. Out of scope
- Editing item images after they're saved (handled in the regular Campaign Editor item editor).
- Bulk item image uploads.
- Image cropping / resizing UI.

### Files likely to change
- `src/pages/AICampaignBuilder.tsx`
- `src/components/ai-campaign/AIChatPanel.tsx`
- `src/components/ai-campaign/ImageUploadPrompt.tsx` (small prop addition)
- `supabase/functions/ai-campaign-builder/index.ts`
- Possibly a new migration if `campaign_items.image_url` doesn't exist.

