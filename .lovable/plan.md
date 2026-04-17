

## Goal
After draft save, add a clear transition into the items phase and collapse the Details summary card so the Campaign Items card is visible.

## Investigation needed
<lov-tool-use id="toolu_vrtx_01Xx9QEdb6TUYbwxLrkz3jEk" name="code--search_files" integration-id="code" data="{\"query\": \"ai-builder|AIBuilder|ai_builder\", \"include_patterns\": \"src/**/*.tsx,src/**/*.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_013u2UXcgy4TTLcGndBE6y7k" name="code--search_files" integration-id="code" data="{\"query\": \"create_campaign_draft\", \"include_patterns\": \"src/**/*.tsx,src/**/*.ts,supabase/**/*.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01MuMt9K7zuSWbeW62LinY6A" name="code--search_files" integration-id="code" data="{\"query\": \"ai-builder|AICampaignBuilder|create_campaign_draft\", \"include_patterns\": \"src/**/*.tsx,src/**/*.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01BHMbn9HUKZTRvTgouznmhp" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/AICampaignBuilder.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_019SHx9cJcRWqYowkiGh5es4" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/ai-campaign/AICampaignPreview.tsx\"}">
</lov-tool-use>
Now I have enough context. The user wants two things:

1. A transition message in chat when draft is saved (currently just toast + brief message)
2. Collapse the "Details" card after draft saved, showing "Draft saved" status, and surface the "Campaign items" card prominently

<lov-plan>

## What's changing
After the campaign draft is saved, the right-hand preview panel and the chat both need to clearly signal a phase transition to "items collection".

## Changes

### 1. Preview panel — collapse Details card post-draft (`src/components/ai-campaign/AICampaignPreview.tsx`)
- Wrap the **Details** card in a `<Collapsible>` (already in `src/components/ui/collapsible.tsx`).
- Default state: **expanded** during `collecting` / `ready_to_create`, **collapsed** once `phase === "post_draft"` or `"collecting_items"` or `"complete"`.
- Card header becomes a `CollapsibleTrigger`: shows "Details" + green "Draft saved" badge on the right + chevron indicator. Clicking toggles.
- Move the **Campaign items** card so it renders directly under Details (so when Details collapses, items card is immediately visible without scrolling).
- Keep all existing field-row content unchanged inside `CollapsibleContent`.

### 2. Chat transition message (`src/pages/AICampaignBuilder.tsx`)
The current post-draft assistant message ("Great — your draft … is saved. 🎉 Let's add a few more details…") only mentions image upload. Replace with a clearer two-part transition that names the new step:

> "✅ **Primary details saved!** Your draft **{name}** is ready.
> Now let's add your campaign **{itemNoun}s** — these are what supporters will sponsor or purchase. First, would you like to upload a campaign image to make it stand out?"

Keep the existing image-upload suggestion chip.

Also: when the AI edge function returns `createdCampaignId` (server-side draft creation path in `callAi`), inject the same transition assistant message into chat (currently only a toast fires — chat continues silently). This guarantees both code paths (manual "Create Draft" button + AI tool-triggered draft) show the transition.

### 3. Tweak toast copy
Change toast description from "Let's add your campaign items." to "Now let's add your campaign items." (matches user's wording).

## Files to change
- `src/components/ai-campaign/AICampaignPreview.tsx` — collapsible Details card, reorder cards, add "Draft saved" inline badge in header.
- `src/pages/AICampaignBuilder.tsx` — richer transition chat message in `handleCreateDraft` AND in `callAi` when `createdCampaignId` first appears.

## Out of scope
- No edge-function logic changes.
- No schema/phase changes.
- Items card UI itself unchanged (just repositioned).

