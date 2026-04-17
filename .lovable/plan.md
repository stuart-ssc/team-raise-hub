

## Goal
Reorder the preview cards and auto-collapse "Extended Details" once its three checklist items are resolved.

## Current order (post-draft)
1. Details (collapsible)
2. Campaign Items
3. Extended Details

## New order (post-draft)
1. Details (collapsible — already collapsed once draft saved)
2. **Extended Details** (collapsible — collapses automatically once image, roster attribution, and participant directions are all resolved)
3. **Campaign Items**

## Changes

### `src/components/ai-campaign/AICampaignPreview.tsx`
1. **Swap card order**: move the Extended Details `<Card>` block above the Campaign Items `<Card>` block.
2. **Make Extended Details collapsible**: wrap it in `<Collapsible>` with a `CollapsibleTrigger` header (mirrors Details pattern — chevron + small "Complete" badge when done).
3. **Auto-collapse logic**: derive `extendedDetailsDone = postDraftItems.every(i => i.done)`. Add `useState` + `useEffect` so the card auto-collapses the first time `extendedDetailsDone` becomes true (don't force re-collapse if user manually re-opens).
4. **Header badge**: when `extendedDetailsDone`, show a green "Complete" badge (matching the "Draft saved" style on Details). Otherwise show count like "1 of 3".

## Out of scope
- No edge function changes.
- No changes to chat copy or phase logic.
- Items card behavior unchanged.

