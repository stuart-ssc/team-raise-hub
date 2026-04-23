

## Goal
Multi-select on `/dashboard/donors` already works — checkboxes per card, "select all" in the header, and a floating bottom toolbar with Add Tags · Add to List · Contact about Fundraiser · Send Email · Export CSV. The problem is **discoverability**: the checkbox is small and the card's primary click navigates to the donor detail page, so users don't realize they can select multiple donors. We'll make selection the obvious primary interaction.

## Changes

### `src/pages/Donors.tsx` — donor card interaction model

**1. Card click behavior**
- When **0 donors are selected**: clicking the card body navigates to the donor detail page (current behavior).
- When **1+ donors are selected**: clicking anywhere on the card body toggles that donor's selection instead of navigating. This is the standard "select mode" pattern (Gmail, Files apps). The dropdown menu still works for per-donor actions.

**2. Larger, more visible checkbox**
- Increase the checkbox from default (`h-4 w-4`) to `h-5 w-5` and give it a clearer container so it reads as the primary card affordance.
- Keep it in the top-left of the card.
- Always visible (not just on hover) so users immediately understand cards are selectable.

**3. Selection-mode visual cues**
- When 1+ donors are selected, add a subtle hint to unselected cards (e.g., the cursor stays pointer but card hover preview swaps to a selection ring instead of a navigation hover).
- Selected cards keep the existing `border-primary ring-2 ring-primary/20` treatment.

**4. Header "Select all visible" polish**
- Add a short helper text next to the select-all checkbox: e.g. *"Select all on this page"* (only shown on `md+` screens). Makes the bulk-action capability obvious before the user has clicked anything.

**5. Bulk Action Toolbar visibility**
- The toolbar already exists (`fixed bottom-6`) and shows on selection. Verified it renders with the full action set. No code change — but we'll briefly check that page padding-bottom doesn't let the toolbar overlap the last row of donor cards. If it does, add `pb-24` to the page container so the last card stays clear of the floating toolbar.

## Out of scope
- Wiring up the real "Contact about Fundraiser" flow (still a toast stub — next iteration).
- Any change to participant view (`isParticipantView`), which intentionally hides selection.

## Verification
- Visit `/dashboard/donors`. Each donor card shows a clearly visible checkbox in its top-left.
- With nothing selected, clicking a card navigates to the donor's detail page (existing behavior preserved).
- Click the checkbox on one card → that donor is selected and the floating bottom toolbar appears with: **Add Tags · Add to List · Contact about Fundraiser · Send Email · Export CSV · Clear**.
- With at least one donor selected, clicking elsewhere on any other card toggles its selection (does NOT navigate). The dropdown menu (`⋯`) still opens per-donor actions.
- Header "Select all on this page" checkbox toggles every visible donor; indeterminate state shows when a subset is selected.
- The bottom toolbar never visually overlaps the last row of cards — page has enough bottom padding.
- Clicking **Clear** in the toolbar empties the selection and restores normal click-to-navigate behavior.

