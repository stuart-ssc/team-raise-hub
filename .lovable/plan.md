

# Use Active Group Context in AI Campaign Builder

## Problem
1. The page ignores the active group selected in the header (e.g. "Varsity Basketball"). When only one group exists or one is already selected, the AI still asks "which team?" unnecessarily.
2. After the user says what they want (e.g. "sell banners for our gym"), the AI doesn't confirm the campaign type it matched — it just silently sets it and moves on.

## Changes

### 1. `src/pages/AICampaignBuilder.tsx`
- Read `activeGroup` from `useActiveGroup()` (already imported but only using `groups`).
- Pass `activeGroupId` to the edge function in the request body.
- If `activeGroup` exists (or only 1 group), pre-fill `collectedFields.group_id` on initial state so the preview shows it immediately.
- Make the initial greeting dynamic: if a group is known, say "Hi! I'm here to help you set up a new campaign for **Varsity Basketball**. What kind of fundraiser are you planning?" instead of the generic message. Show campaign type suggestion chips on the initial message.

### 2. `supabase/functions/ai-campaign-builder/index.ts`
- Accept `activeGroupId` from the request body. If provided and matches a group, auto-fill `group_id` (in addition to the existing single-group auto-fill logic).
- Update the system prompt to include a new rule: "When you match a campaign type from the user's description, CONFIRM it explicitly (e.g. 'Great, I'll set this up as a Merchandise Sale.') before moving to the next field."
- Pass the auto-filled group name context so the AI knows not to ask about the group.

### 3. Initial message with suggestions
- In `AICampaignBuilder.tsx`, when groups are loaded and a group is known, attach campaign type suggestions to the initial assistant message so the user sees clickable chips right away.

## Files
- `src/pages/AICampaignBuilder.tsx` — use activeGroup, dynamic initial message, pre-fill group
- `supabase/functions/ai-campaign-builder/index.ts` — accept activeGroupId, confirm campaign type rule

