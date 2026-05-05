## Issues to fix

### 1. Image upload not saving to the fundraiser
`ImageUploadPrompt` calls `onUploaded(url)` → frontend sends synthetic message `Image uploaded: <url>` → edge function regex captures it and writes `image_url`. The DB write is **fire-and-forget** (no await on result, no error surfacing) and gated by `!updatedFields.image_url`, so a stale field can block re-saves and silent failures look "saved" in the optimistic preview.

**Fix:**
- In `ImageUploadPrompt.tsx`, after the storage upload, write `campaigns.image_url` directly via `supabase.from("campaigns").update(...).eq("id", campaignId).select().single()`. If it fails, toast the error and do NOT call `onUploaded`.
- Standardize the storage path to `${campaignId}/cover-${Date.now()}.${ext}` to match the editor's expectations.
- In the edge function, drop the `!updatedFields.image_url` guard on the synthetic image capture and properly await + log the update.

### 2. Recurring/size chip glitch (screenshot)
Assistant text says "Is this a recurring donation/ticket…" while chips show "Size / tier label — Skip". The state machine is on `size` (correct) but the LLM drifted to the next question. The server-side `CANNED_QUESTIONS` override only covers a subset of fields — there are no entries for `size`, `description`, `max_items_purchased`, `name`, etc., so item-field drift slips through.

**Fix:** in `supabase/functions/ai-campaign-builder/index.ts`, generalize the canned-question override: when `suggestions.field` matches an `ITEM_FIELDS[].key` and no canned entry exists, fall back to the field's own `prompt` template (rendered with `itemNoun`/examples). Add explicit canned entries for every item field for clarity.

### 3. Campaign-level "requires sponsor info" question is obsolete
`ASK_ORDER` still includes `requires_business_info` and the post-draft flow runs the full sponsor-asset deadline + required-asset sub-flow. Per current model, this is determined per-item via `campaign_items.is_sponsorship_item`.

**Fix in edge function:**
- Remove `requires_business_info` from `ASK_ORDER`, the canned questions, the next-field router, and `create_campaign_draft` insert.
- Remove the post-draft branches: `sponsorAssetsRequired`, `asset_upload_deadline`, `add_required_asset`, `pending_required_assets`, `sponsor_assets_complete` (and matching chip suggestions).
- For Sponsorship campaign types, ask `is_sponsorship_item` as the second item field (after `name`) with Yes/No chips, default Yes; persist on `save_campaign_item`.
- After saving any item with `is_sponsorship_item=true`, auto-set `campaigns.requires_business_info=true` so downstream checkout still gates correctly.

### 4. Item names always saved as lowercase
The deterministic capture in the edge function lowercases / normalizes the item name. We need to preserve the user's exact casing for `name` (and `size`).

**Fix:** in `supabase/functions/ai-campaign-builder/index.ts` deterministic-capture block (around the `next.key === "name" || next.key === "size"` branch), store `raw.trim()` exactly — do not pass through `toLowerCase()` or any normalizer. Audit `update_item_field` tool args path too: do not mutate string casing for `name`/`size`/`description`. (If the LLM itself returns a lowercased value, prefer the user's last raw message when capturing `name`/`size`.)

---

## Files to change

- `supabase/functions/ai-campaign-builder/index.ts` — remove campaign-level sponsor questions, add `is_sponsorship_item` per-item ask, generalize canned-question override, harden image_url save, preserve item-name casing.
- `src/components/ai-campaign/ImageUploadPrompt.tsx` — write `campaigns.image_url` directly with verification + error toast; standardize path.
- `src/pages/AICampaignBuilder.tsx` — only mark `image_url` in `collectedFields` after confirmation comes back from the edge function/DB write.

## Verification
1. Upload a cover image in the AI builder → confirm `campaigns.image_url` populated and editor's Cover tab shows it.
2. Walk item setup; each optional field (description, max per buyer, size, recurring) is asked one at a time with chips matching the question text.
3. Type "Bronze Sponsor" as an item name → confirm DB stores `Bronze Sponsor`, not `bronze sponsor`.
4. `requires_business_info` is never asked at the campaign level. For a Sponsorship campaign, `is_sponsorship_item` is asked per item.
