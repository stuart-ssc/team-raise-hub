

## Problem
When Taylor (a participant) clicks one of her uploaded donors (Donor Five / Six), `DonorProfile.tsx` shows "Access Denied" and bounces back to /dashboard/donors — even though those donors are correctly attributed to her (`added_by_organization_user_id = Taylor's org_user id`) and show "Added by you" on the list page.

## Root cause
A race condition in `useParticipantConnections`, not RLS.

- The hook initializes `loading = false` and only sets it to `true` *inside* `fetchConnections`, which runs in `useEffect` after the component mounts.
- `DonorProfile` gates its access check on `!connectionsLoading`. On first render, `connectionsLoading` is already `false` and `connectedDonorEmails` is still `[]`, so `fetchDonorData()` fires immediately.
- The check `connectedDonorEmails.includes(donorData.email)` returns false against the empty array → toast + redirect, before the hook finishes loading the real list.

Database confirms the donors are correctly owned by Taylor:

| Donor | Email | added_by_organization_user_id |
|---|---|---|
| Donor Five | donor@sparky.co | 47ddbeb5… (Taylor) |
| Donor Six | six@donor.com | 47ddbeb5… (Taylor) |

So the data and the hook's logic are both correct — the timing is wrong.

## Fix

### 1. `src/hooks/useParticipantConnections.ts`
- Initialize `loading = true` when `isParticipantView` is true so consumers wait for the first fetch.
- Set `loading = false` in the early-return branch (non-participant views).
- Add `allRoles.length` to the effect's dependency array so changes in roles re-trigger the fetch.

### 2. `src/pages/DonorProfile.tsx`
- Defensive guard: only run the participant access check **after** `connectionsLoading === false` AND the hook has had a chance to populate (already covered by the hook fix, but also keep `connectionsLoading` in the gating `useEffect` — which it already is). No logic change needed here once the hook is corrected.
- Normalize the email comparison to lowercase on both sides (cheap safety against future case-mismatch bugs):
  `connectedDonorEmails.map(e => e.toLowerCase()).includes(donorData.email.toLowerCase())`.

### 3. `src/pages/BusinessProfile.tsx` (same race exists)
No code change required after the hook fix, but verify the equivalent `connectedBusinessIds.includes(...)` check now resolves after `connectionsLoading` flips correctly.

## Files touched
- `src/hooks/useParticipantConnections.ts` — fix initial `loading` state.
- `src/pages/DonorProfile.tsx` — case-insensitive email comparison.

## Verification
- As Taylor: open `/dashboard/donors`, click **Donor Five** → profile loads; no Access Denied toast; donation history shows $0 (correct, no completed orders).
- As Taylor: open `/dashboard/donors`, click **Donor Six** → same — loads cleanly.
- As Taylor: try to navigate directly to `/dashboard/donors/<some-other-donor-id-not-attributed-to-her>` → still correctly blocked with "Access Denied" and redirected.
- As an admin (Sample School admin): donor profile pages still load for any donor in the org.
- BusinessProfile page exhibits the same fix automatically — no regression.

