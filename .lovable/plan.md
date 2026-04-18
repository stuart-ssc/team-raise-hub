

## Two bugs from the screenshots

### Bug 1 (this turn): Adding second item skipped the name question
Screenshot shows: after first item saved, user clicked "Add another", AI replied *"Got it — 'add another'. How much does it cost?"* — jumped straight to **cost**, skipping **name**.

**Root cause hypothesis:** When `awaitingAddAnother === true` and user replies "add another", the edge function isn't properly resetting `currentItemDraft` AND/OR is treating the literal string "add another" as the answer to the next field. Need to inspect `supabase/functions/ai-campaign-builder/index.ts` to confirm.

### Bug 2 (previous screenshot, "Also this happened"): Order of operations is wrong
Screenshot shows: AI says *"Would you like to publish it now, or open the editor?"* → user clicks **Open in editor** → AI then says *"Awesome — setup is done! 🎉 Now let's add your first sponsorship item. What's the name?"*

The publish/open-editor prompt fired **before** items were collected. Items collection should happen between draft creation and the final publish prompt — not after.

## Investigation plan

Read `supabase/functions/ai-campaign-builder/index.ts` to confirm:
1. The `awaitingAddAnother` branch — how `currentItemDraft` is reset and how the "add another" string is handled.
2. The phase transitions — when does `phase` move to `complete` and trigger the publish/editor prompt? It should only fire after items collection (or after user explicitly says "no more items"), not in the post_draft phase.

## Plan

### Fix 1: "Add another" must reset draft cleanly and ask for name
**File:** `supabase/functions/ai-campaign-builder/index.ts`

In the `awaitingAddAnother === true` handler:
- If user input matches add-another intent (`/add another|another|yes|one more/i`): reset `currentItemDraft = {}`, set `awaitingAddAnother = false`, and emit a fresh prompt: *"Great — what's the name of the next {itemNoun}?"* Do NOT pass the user's "add another" string into the field-extraction logic.
- If user input matches done intent (`/done|no|finish|that's it|publish/i`): set `awaitingAddAnother = false`, transition to the publish/open-editor prompt.
- Add a guard at the top of the field-extraction code path: if `awaitingAddAnother === true`, skip field extraction entirely.

### Fix 2: Publish/open-editor prompt only fires after items phase
**File:** `supabase/functions/ai-campaign-builder/index.ts`

- Phase ordering: `collecting` → `post_draft` (image / roster / directions) → `collecting_items` → `complete` (publish/open-editor prompt).
- Audit the transitions so `complete` is only reached when `awaitingAddAnother === true` AND user picks "I'm done" — not at the end of `post_draft`.
- After the post_draft questions resolve, the next assistant message must be the items kickoff (*"Now let's add your first sponsorship item — what's the name?"*) with `phase = "collecting_items"`. The publish/open-editor prompt must NOT appear here.

### Fix 3: Frontend safety
**File:** `src/pages/AICampaignBuilder.tsx`

- Confirm the `finalAction === "publish"` / `"open_editor"` handlers only run when `phase === "complete"`. Add a guard so a stale/early `finalAction` from the edge function is ignored if items haven't been added yet (defense-in-depth — the real fix is server-side).

### Out of scope
- Fee model copy (already shipped).
- Item field order itself.
- Item image upload flow.

