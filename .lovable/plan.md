

# Fix: Parent Invitation Accept Flow for Existing Users

## Root Cause

Three issues are preventing the invitation from being accepted:

1. **Race condition on Family Dashboard**: The email link sends Stuart to `/dashboard/family?accept-invite=TOKEN`. The page loads and shows "no connected students" because the `accept-parent-invitation` function hasn't completed yet. The accept logic runs in a `useEffect`, but the family data fetch also runs simultaneously, showing empty state before the invite is processed.

2. **DashboardRedirect also has accept-invite logic but it conflicts**: `DashboardRedirect.tsx` (at `/dashboard`) handles `accept-invite` too, but Stuart lands on `/dashboard/family` directly from the email link, bypassing it. Meanwhile on the family dashboard, the accept logic fires but may fail silently or the page doesn't re-render properly after acceptance.

3. **Possible origin mismatch**: The `baseUrl` fallback in the edge function is `https://sponsorly.app` instead of `https://sponsorly.io` (or the published URL). If the request `origin` header is missing, the email link could point to the wrong domain entirely, causing Stuart to hit a login page on the wrong site.

## Fixes

### Fix 1: Update `baseUrl` fallback in edge function
In `supabase/functions/send-parent-invitation/index.ts`, change the fallback URL from `https://sponsorly.app` to the correct published URL (`https://team-raise-hub.lovable.app` or `https://sponsorly.io`).

### Fix 2: Move invite acceptance to DashboardRedirect only
Remove the duplicate `accept-invite` handling from `FamilyDashboard.tsx`. Instead, handle it exclusively in `DashboardRedirect.tsx` (which runs at `/dashboard`). Change the email link from `/dashboard/family?accept-invite=TOKEN` to `/dashboard?accept-invite=TOKEN`.

This way:
- Stuart clicks the link, lands on `/dashboard?accept-invite=TOKEN`
- `DashboardRedirect` detects the token, calls `accept-parent-invitation`
- After success, refreshes roles and the role switcher appears
- Stuart can then switch to the family dashboard via the switcher

### Fix 3: Ensure accept-invite runs before redirect logic
In `DashboardRedirect.tsx`, make the invite acceptance run and complete **before** the redirect logic evaluates. Currently, the redirect checks (isParentOnly, isDonorOnly, etc.) can fire before the invite is processed, causing premature navigation.

### Fix 4: Remove duplicate accept-invite from FamilyDashboard
Clean up the duplicate code in `FamilyDashboard.tsx` since it will all be handled in `DashboardRedirect.tsx`.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-parent-invitation/index.ts` | Change email link to `/dashboard?accept-invite=TOKEN` and fix fallback baseUrl |
| `src/components/DashboardRedirect.tsx` | Ensure accept-invite completes before redirect evaluation; show loading during acceptance |
| `src/pages/FamilyDashboard.tsx` | Remove duplicate accept-invite handling |

## Technical Details

### Edge function change (send-parent-invitation)
- Line 144: Change fallback from `"https://sponsorly.app"` to `"https://team-raise-hub.lovable.app"`
- Line 146: Change path from `/dashboard/family?accept-invite=` to `/dashboard?accept-invite=`

### DashboardRedirect change
- The existing `accept-invite` useEffect already calls `accept-parent-invitation` and refreshes roles
- Add a guard so redirect logic waits while `acceptingInvite` is true (it already has the `acceptingInvite` state, just need to add it to the loading check)
- After successful acceptance, the `isParentOnly` check will re-evaluate and redirect to `/dashboard/family` if the user is now parent-only, or the role switcher will be available if they have other roles too

### FamilyDashboard change
- Remove lines 83-114 (the accept-invite useEffect block)
- Remove the `useSearchParams` import and `searchParams`/`setSearchParams` usage if no longer needed
