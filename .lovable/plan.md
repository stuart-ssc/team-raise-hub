# Fix: "Open in editor" chip restarts item collection

## Problem

When you finish adding items in the AI Fundraiser Builder and click **I'm done**, the assistant should move to the "complete" phase and offer two final chips: **Publish now** and **Open in editor**. Instead:

1. Right after clicking "I'm done", the assistant prints "Now let's add your first item. What's the name?" — even though items have already been added.
2. Clicking the **Open in editor** chip then re-fires "Awesome — setup is done! 🎉 Now let's add your first item…" instead of navigating to the editor.

Both symptoms come from the same root cause in the edge function.

## Root cause

In `supabase/functions/ai-campaign-builder/index.ts` (around line 1959–1977), there is a "post_draft → collecting_items" transition guard that overrides the assistant message with the canned "Awesome — setup is done! 🎉 Now let's add your first {item}…" text whenever:

- the campaign exists,
- the client is NOT currently in items phase,
- setup tasks are done,
- and the current item draft is empty.

After the user exits items collection (via "I'm done"), the next turn arrives with `clientPhase = "complete"` and an empty draft — so this guard misfires and re-prompts for the first item, even though items have already been saved (`itemsAdded > 0`) and we're heading to the complete state.

In addition, when the user clicks the **Open in editor** chip in the complete phase, the server-side detection on line 2257–2263 correctly sets `finalAction = "open_editor"`, but the assistant text shown is still the misfired "first item" prompt, which is confusing even when the client navigation eventually fires.

## Changes

### 1. `supabase/functions/ai-campaign-builder/index.ts`

**a. Tighten the `justEnteringItemsPhase` guard (line ~1967).**

Add two extra conditions so the canned "Awesome — setup is done!" message is only emitted when the user is genuinely transitioning from post-draft setup into items collection for the first time — not when they have already finished items and are at the complete step:

- `itemsAdded === 0` — no items have been saved yet.
- `!exitItemsCollection` (already present) — the user did not just say "I'm done".
- New: `clientPhase !== "complete"` — the client isn't already at the final step.

**b. Honor `finalAction` early.**

When `finalAction === "open_editor"` or `"publish"` is detected, replace the assistant message with a short confirmation ("Opening the editor…" / "Opening publish…") and skip the items-transition block entirely so no stray "first item" text leaks through.

### 2. `src/pages/AICampaignBuilder.tsx`

**a. Reduce the navigation race.**

In the `if (data.finalAction === "open_editor")` branch (around line 251), drop the 300 ms `setTimeout` and navigate immediately. The state updates that precede it are synchronous from React's perspective; the delay just gave the misleading text time to render.

**b. Defensive guard.**

If the server returns `phase === "complete"` AND `itemsAdded > 0` AND the assistant text contains "first item", suppress that message client-side. This is a belt-and-suspenders fallback in case other code paths trigger the same prompt.

## Out of scope

- The "Open in editor" chip's label is sent verbatim as a chat message — that pattern is shared by every chip and is fine. We don't need to change it.
- The `\bdone\b` regex on line 1099 (which also matches "open editor") is correct for the items phase but never runs in the complete phase, so no change there.

## Verification steps after implementation

1. Start a new AI fundraiser, complete primary details, image, roster, and directions setup.
2. Add one item end-to-end. Confirm the post-item prompt is "Want to add another item, or are you done?"
3. Click **I'm done**. Confirm the assistant moves to the "complete" step and offers **Publish now** / **Open in editor** chips — and does NOT say "Now let's add your first item".
4. Click **Open in editor**. Confirm the app navigates straight to `/dashboard/fundraisers/{id}/edit` with no extra item prompt.
5. Repeat with **Publish now** to confirm the publish dialog still opens.
