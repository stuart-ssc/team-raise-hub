

## Goal
Extend the AI builder so that after the core campaign fields are collected (and ideally after the campaign is created so we have a `campaignId`), the AI walks the user through creating one or more **campaign items** field-by-field, then asks if they want to add another item before moving to the publish/editor step.

## Current state
- Phases: `collecting` → `ready_to_create` (campaign saved) → `post_draft` → `complete`
- `CampaignItemsSection.tsx` shows the canonical item fields:
  - **Required**: `name`, `cost`, `quantity_offered`, `quantity_available`
  - **Optional**: `description`, `size`, `max_items_purchased`, `is_recurring` + `recurring_interval`, `image`, plus `has_variants` + variants
- Items are written to `campaign_items` (and `campaign_item_variants`) and are scoped per campaign
- Campaign types exist (sponsorship, donation, event, merchandise, etc.) — wording per type matters (e.g. "sponsorship level" vs "product" vs "ticket")
- Two-paragraph response format and `choice` suggestions already supported in chat

## Plan

### A. New phase: `collecting_items`
Insert between `ready_to_create` (campaign created) and `post_draft`:

```
collecting → ready_to_create → collecting_items → post_draft → complete
```

State persisted in the AI session:
- `currentItemDraft` — partial item being built
- `itemsAdded` — count of items already saved (for UX messaging)

### B. Item field schema (`campaignSchema.ts`)
Add a new exported `campaignItemFields` array, each with `key`, `label`, `prompt`, `type`, `required`, and (optional) `dependsOn`:

| key | type | required | prompt example |
|---|---|---|---|
| name | text | yes | "What's the name of this {itemNoun}?" |
| description | longtext | no | "Add a short description (or skip)." |
| cost | number | yes | "How much does it cost? (USD)" |
| quantity_offered | number | yes | "How many are you offering in total?" |
| max_items_purchased | number | no | "Limit per buyer? (skip for none)" |
| size | text | no | "Any size/variant label? (e.g. 'Large', 'Gold tier')" |
| is_recurring | boolean | no | "Should this be a recurring charge?" |
| recurring_interval | choice (month/year) | conditional | only if `is_recurring=true` |
| image | image-upload | no | "Upload an image (or skip)." |

`quantity_available` is auto-set = `quantity_offered` on creation (mirrors the form's behavior). Variants stay out of scope (single-offering only) for v1.

**Item-noun by campaign type** (used in prompts):
- sponsorship → "sponsorship level"
- merchandise → "item"
- event → "ticket"
- donation → "donation tier"
- default → "item"

### C. Edge function (`supabase/functions/ai-campaign-builder/index.ts`)
1. **Phase transition**: After `createdCampaignId` is returned, set phase to `collecting_items` and emit:
   > "Your campaign is created. 🎉
   >
   > Now let's add your first {itemNoun}. What's the name?"
2. **Per-field loop**: Same pattern as campaign collection — for each field in `campaignItemFields`:
   - Ask single field with two-paragraph format
   - Emit `suggestions` chips for booleans and choice fields
   - Honor `skip` for non-required
3. **Save item**: When all required fields collected, call a new `save_campaign_item` tool that inserts into `campaign_items` with `campaign_id = createdCampaignId`. Acknowledge save.
4. **Loop prompt**: After save, emit a `choice` suggestion:
   > "{Name} added. Want to add another {itemNoun}?"
   > Chips: `["Add another", "I'm done"]`
5. **Exit**: On "I'm done" → transition to `post_draft` (existing flow). On "Add another" → reset `currentItemDraft`, repeat from step 1.
6. **Deterministic shortcuts**: numeric `1`/`2` map to add-another / done.

### D. Frontend (`AICampaignBuilder.tsx` + `AICampaignPreview.tsx`)
- Track `itemsAdded` from edge function response; display count badge in preview pane.
- Preview pane gets a small "Items added: N" section while in `collecting_items` phase.
- No changes to `AIChatPanel` needed — chips/suggestions already render.

### E. Image handling
For v1: AI prompts for image but if user types "skip" or sends text, move on. Actual image upload UI in chat is **out of scope** — they can add images later in the editor. Mention this in the prompt: "(You can add images later in the editor — type 'skip' for now.)"

### F. Out of scope (v1)
- Size variants editor in chat
- Image upload via chat
- Editing previously-added items mid-flow (they can edit in the editor)
- Event start/end dates per item (rarely used; available in editor)

