
## Goal
Fix three issues on `/dashboard/donors`:
1. **Participants (players/parents) can't see selection controls** — bulk selection is currently hidden from participant view.
2. **Per-card "Select" chip is in the top-left** and looks clunky next to the donor name. Move it to the top-right of each donor card.
3. **"Select all on this page" chip** is currently above the donors list on the left. Move it to the top-right of the Donors card/header area.

## Changes

### `src/pages/Donors.tsx`

**1. Enable selection for all roles**
- Remove the `isParticipantView` gate around the per-card selection chip and the header "Select all" chip. Selection UI renders regardless of role.
- Bulk action toolbar (Add Tags · Add to List · Contact about Fundraiser · Send Email · Export CSV · Clear) stays available for all roles. No changes to toolbar logic — it already keys off the selection set.

**2. Move per-card checkbox to top-right of each donor card**
- Remove the `absolute left-3 top-3` selection chip.
- Place the checkbox in the top-right, sharing the row with the engagement badge:
  - Card top row becomes: name/email block on the left, right-side cluster `[Checkbox] [Engagement Badge]` aligned with `flex items-center gap-2`.
  - Remove the "Select" text label — the checkbox alone is enough once it's in a visible corner next to the badge.
  - Keep `stopPropagation()` on the checkbox wrapper so toggling selection never triggers navigation.
- Remove the `pt-6` top padding that was added to avoid the old absolute chip — return card header to normal spacing.

**3. Move "Select all" to the top-right of the Donors list header**
- The Donors list lives inside a wrapper with a header row containing the title `Donors (N)` and subtitle "Click on a donor to view detailed profile…".
- Restructure that header into `flex items-center justify-between`:
  - Left: `Donors (N)` title + subtitle (unchanged).
  - Right: the "Select all on this page" chip (checkbox + "Select all" label), using the existing indeterminate state logic.
- The chip no longer appears above the card grid on its own row.

**4. Styling**
- Keep the subtle `bg-muted/40` hover / `bg-primary/10` selected treatment on the checkboxes so they remain visible on white cards in both the header and per-card locations.
- Per-card checkbox: no label text, just the `<Checkbox>` in a small rounded hover chip (`rounded-md p-1 hover:bg-muted`) to keep it discoverable without feeling heavy.
- Header "Select all" chip: keeps the "Select all" text label for clarity.

**5. Out of scope**
- No changes to bulk toolbar actions, selection state logic, indeterminate logic, navigation behavior, or participant RLS/data access.

## Verification
- Logged in as a **Coach**, **Principal**, **Player**, or **Family Member**: every donor card shows a checkbox in the top-right, next to the engagement badge.
- The "Select all on this page" chip appears at the top-right of the Donors list header, aligned with the `Donors (N)` title.
- Clicking a card's checkbox selects that donor (does not navigate); clicking elsewhere on the card with no active selection navigates; clicking elsewhere with an active selection toggles.
- Header "Select all" toggles all visible donors and shows indeterminate state for partial selection.
- Bulk action toolbar works for all roles.
