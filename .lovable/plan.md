
## Goal
Hide the "Drip cadence" preview box from the review step of `ContactFundraiserDialog`. Users don't need to see the per-email schedule — Sponsorly manages outreach timing on their behalf.

## Changes

### `src/components/ContactFundraiserDialog.tsx` — review step
- Remove the entire "Drip cadence" card (lines ~269-300): the heading, schedule list, and the "X emails per donor…" summary.
- Keep the empty/error state (`schedule.length === 0` → "This fundraiser ends too soon to schedule outreach.") but render it as a small inline destructive message above the Recipients card, so the dialog still blocks enrollment when the campaign ends too soon.
- Keep the campaign summary card (top) and Recipients card (bottom) untouched.
- Existing behavior: the Enroll button remains disabled when `schedule.length === 0` — no change to that logic.
- Remove the now-unused `Send` and `stageLabel`/`DripStage` references in the review block (keep the `schedule` computation intact since it still gates the Enroll button).

## Verification
- Open dialog → pick a fundraiser → review step shows only the campaign summary and Recipients card. No cadence list, no per-email timestamps.
- Picking a campaign that ends in <1 day still shows the "ends too soon" warning and disables the Enroll button.
- Enroll still works for valid campaigns; backend behavior unchanged.
