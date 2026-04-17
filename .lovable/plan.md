

## Goal
Reorder the post-draft flow so the user is asked about (1) campaign image, (2) roster/peer-to-peer attribution, and (3) any campaign instructions BEFORE the assistant starts collecting campaign items.

## Current flow (broken ordering)
After draft save → image prompt → immediately jumps into items collection (name, price, qty…). Roster attribution and instructions are never asked.

## Desired flow
After draft save (`phase = post_draft`):
1. **Image upload** — "Want to upload a campaign image?" (existing image_upload chip, can skip)
2. **Roster attribution** — "Is this a peer-to-peer fundraiser where individual roster members get their own page?" (yes/no chip → sets `enable_roster_attribution`)
3. **Campaign instructions / extra notes** — "Any special instructions for supporters at checkout? (e.g. delivery info, event date reminder) — or say skip" (free text → `instructions` / `checkout_instructions` field, optional)
4. THEN transition to items: "Great — now let's add your first {itemNoun}."
   → phase flips to `collecting_items`, item questions begin.

## Changes

### 1. Edge function (`supabase/functions/ai-campaign-builder/index.ts`)
- Add a new intermediate phase `post_draft_setup` (or reuse `post_draft` as a multi-step state) with an internal step counter: `image → attribution → instructions → done`.
- Track step in payload echoed to/from frontend (`postDraftStep: "image" | "attribution" | "instructions" | "done"`).
- System prompt: add explicit ordering rule — "After draft creation, ask in order: image, then roster attribution, then instructions. Only after instructions step (answered or skipped) move to `collecting_items` and call the item flow."
- Add deterministic capture:
  - `enable_roster_attribution` boolean from yes/no replies on attribution step.
  - `checkout_instructions` (or appropriate existing column — we'll confirm during impl by reading the campaigns schema) string from the instructions step; "skip" → mark skipped.
- Suggestion chips returned per step:
  - image step → existing `image_upload` chip
  - attribution step → `choice` chip with Yes / No
  - instructions step → `choice` chip with "Skip" + free text input
- Only emit `phase: "collecting_items"` after the instructions step is resolved.

### 2. Frontend (`src/pages/AICampaignBuilder.tsx`)
- Add `postDraftStep` state, send/receive it in `callAi` payload (mirrors existing items-state sync pattern).
- Update transition message after draft save to set expectations:
  > "✅ Primary details saved! Before we add items, I just need three quick things: a campaign image, whether this is a peer-to-peer fundraiser, and any checkout instructions."
- Then immediately ask the image question (step 1).

### 3. Preview panel (`src/components/ai-campaign/AICampaignPreview.tsx`)
- Show a small "Setup checklist" section above the Campaign Items card while `phase === "post_draft"`:
  - ☐/☑ Campaign image
  - ☐/☑ Peer-to-peer attribution
  - ☐/☑ Checkout instructions
- Each item checks off as the corresponding field is captured (or skipped).
- Items card stays disabled/grayed until checklist is done, then activates.

### 4. Field verification
During implementation, read `src/integrations/supabase/types.ts` to confirm exact column names on `campaigns` for:
- roster attribution flag (likely `enable_roster_attribution`)
- checkout/campaign instructions (likely `instructions` or `checkout_instructions` — use whichever exists; if neither, store on `description` append or add note in plan).

## Files to change
- `supabase/functions/ai-campaign-builder/index.ts` — new post-draft step machine, prompt rules, deterministic capture for attribution + instructions.
- `src/pages/AICampaignBuilder.tsx` — track and forward `postDraftStep`, updated transition message.
- `src/components/ai-campaign/AICampaignPreview.tsx` — setup checklist UI between Details and Items cards.

## Out of scope
- Items-collection logic itself (already working after last fix).
- No schema migrations unless a missing column is discovered during impl — in that case I'll surface it before adding.

