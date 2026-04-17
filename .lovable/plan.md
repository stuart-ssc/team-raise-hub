

## Investigation

From the console logs at `/dashboard/campaigns`, I can see formatted campaigns include drafts like "Bannerize", "Banerize", "Give me money", "Test 20", etc. with `publication_status: "draft"`. So drafts ARE being fetched successfully.

The issue is likely a **filter** on the Campaigns page that hides drafts by default (e.g. only shows `status: true` / published, or filters by group/active).

Notably:
- "Bannerize" (id `36e3...`) has `status: false`
- "Test 20", "Tester 30", "Bannerize" (9dbd...), "Test drive" — all `status: false` and `publication_status: "draft"`

Need to check `src/pages/Campaigns.tsx` to see how it renders/filters the list.

## Plan

1. Open `src/pages/Campaigns.tsx` to find any filter that excludes drafts (status toggle, tab filter, or active-only).
2. Identify if drafts are being filtered out by:
   - Default tab (e.g. "Active" only)
   - `status === true` filter
   - Group filter via `ActiveGroupContext`
3. Fix by either:
   - Showing drafts in default view with a "Draft" badge, OR
   - Adding a visible "Drafts" tab/filter so the user can find them
4. Confirm draft cards link to the editor (so user can finish them).

## Files to change
- `src/pages/Campaigns.tsx` — adjust filter logic and/or add a Drafts tab.

## Out of scope
- AI builder edge function changes
- DB schema or RLS changes (data is already returning correctly)

