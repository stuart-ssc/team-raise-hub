

## Goal
Move the AI Insights panel out of the main (left) column on the donor profile and place it in the right sidebar, directly under the Business Affiliations card.

## Changes

### `src/pages/DonorProfile.tsx`

1. **Remove** the `<DonorInsightsPanel donorId={donor.id} />` block currently rendered between the Stats Cards and the Giving History card in the left column (around line 429–430).
2. **Insert** the same `<DonorInsightsPanel donorId={donor.id} />` in the right sidebar, immediately after the Business Affiliations `Card` block (around line 636) and before the Notes card.

No prop changes, no styling tweaks — the panel already renders well at the narrower sidebar width.

### Result
```text
Left column (lg:col-span-2)        Right sidebar
─────────────────────────────      ─────────────────────────
Stats Cards (3 tiles)              Contact Information
Giving History                     Business Affiliations
Activity Timeline                  AI Insights   ← moved here
Communication History              Notes
```

## Files touched
- `src/pages/DonorProfile.tsx`

## Verification
- AI Insights card no longer appears between Stats Cards and Giving History.
- AI Insights card now appears in the right column directly below Business Affiliations (or below Contact Information when there are no business affiliations).
- Notes card remains the last item in the right sidebar.
- No regressions to participant-view permission gating or existing data fetching.

