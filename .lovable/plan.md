

## Goal
On the "Contact about a Fundraiser" picker, hide ended fundraisers entirely so users only see fundraisers they can actually enroll donors into.

## Changes — `src/components/ContactFundraiserDialog.tsx`

- In `fetchCampaigns`, add a server-side filter excluding fundraisers whose `end_date` has passed: `.or('end_date.is.null,end_date.gt.<nowISO>')`. Keeps "no end date" campaigns visible (still publishable) and drops anything past its end date.
- Remove the now-unused `isEnded()` helper and the disabled/greyed-out "Ended" card branch — every card in the list is now active and clickable.
- Keep the `Calendar` "Ends {date}" badge (active end-dates only).
- Keep the existing "ends too soon to schedule outreach" guard on the review step (covers campaigns ending later today).

## Verification
- Open dialog → list contains only fundraisers with no end date or a future end date. "Sample Golf Scramble" and "Sample Merchandise Campaign" (both Ended) no longer appear.
- Every card in the list is fully opaque and clickable; selecting one advances to the review step.
- Search still filters the (now active-only) list.

