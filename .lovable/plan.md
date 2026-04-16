

# Fix: Active Group Not Reflected in AI Builder Initial Message

## Problem
Race condition: the initial message `useEffect` fires when `campaignTypes` load, but `activeGroup` from context hasn't resolved yet (it depends on an async fetch). Once `initialMessageSet = true`, the effect never re-runs.

For org admins, `activeGroup` is only set if `?group=xxx` is in the URL. The header group selector sets this param, but the context fetches groups asynchronously — so it's often `null` when the initial message fires.

## Fix

In `src/pages/AICampaignBuilder.tsx`:

1. **Wait for the ActiveGroupContext to finish loading before setting the initial message.** Add a guard: don't fire the initial message effect until `activeGroups.length > 0` (context groups loaded) OR `activeGroup` is set. For org admins with multiple groups and none selected, also wait for the context's groups to load, then fall back to the locally-fetched `groups` list to check for single-group auto-select.

2. **Simplify the guard logic:** Wait for both `campaignTypes` AND the context's `groups` array to be populated (or `activeGroup` to be set) before composing the initial message. This ensures we know the user's group situation before greeting them.

3. **Updated effect condition:**
   ```
   if (initialMessageSet) return;
   if (campaignTypes.length === 0) return;
   if (activeGroups.length === 0 && !activeGroup) return; // wait for context
   ```

This ensures the greeting always reflects the active group when one is selected in the header.

## File
- `src/pages/AICampaignBuilder.tsx` — add guard for `activeGroups` loading before setting initial message

