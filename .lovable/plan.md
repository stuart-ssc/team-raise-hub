

## Goal
Make donor selection on `/dashboard/donors` more discoverable and add a new **Contact about Fundraiser** bulk action alongside existing ones (Add Tags, Add to List, Send Email, Export CSV). The selection + Add to List flow already exists but the checkboxes are tiny shadcn-style native inputs tucked next to the engagement badge — easy to miss. We'll surface selection clearly and stub the new action so we can wire functionality next.

## Changes

### 1. `src/pages/Donors.tsx` — make selection obvious
- Replace the small native `<input type="checkbox">` in each donor card with the shadcn `Checkbox` component, moved to the **top-left** of the card (before the name) so it's the first thing the eye lands on. Keep the engagement badge + dropdown menu on the right.
- Add a **"Select all visible"** checkbox + count label inside the Donors card header (e.g., `Donors (12)` row), to the left of the title. Toggling it selects/deselects every donor in `filteredDonors`. Show indeterminate state when some (but not all) are selected.
- Pass a new `onContactFundraiser` handler to `BulkActionToolbar` that opens a placeholder toast: *"Contact about Fundraiser — coming soon"* (real functionality next iteration).
- Selection still hidden in `isParticipantView`.

### 2. `src/components/BulkActionToolbar.tsx` — add new action button
- Add a new optional prop `onContactFundraiser?: () => void`.
- Render a new button **"Contact about Fundraiser"** (icon: `Megaphone` from lucide-react) in the toolbar action group, positioned right after **Add to List** and before **Send Email**.
- Keep all existing buttons and styling. Buttons only render when their handler is provided (already the pattern for `onAddToList`).

### 3. (Optional polish) Sticky selection summary
- When 1+ donors are selected, scroll the page so the floating `BulkActionToolbar` (already fixed-bottom) remains visible — no code change needed; just verifying current behavior. No change.

## Out of scope (next iteration)
- The actual Contact-about-Fundraiser flow: campaign picker, message composer, email send. The button + toast stub is all this iteration ships.

## Verification
- Visit `/dashboard/donors` as an org admin. Each donor card shows a clearly visible shadcn checkbox in its top-left.
- A "Select all" checkbox in the Donors card header toggles every visible donor; indeterminate state shows when a subset is selected.
- Selecting one or more donors reveals the floating bottom toolbar with: **Add Tags · Add to List · Contact about Fundraiser · Send Email · Export CSV · Clear**.
- Clicking **Add to List** opens the existing `AddToListDialog` and successfully adds the selected donors to the chosen list.
- Clicking **Contact about Fundraiser** shows a toast confirming the action was triggered (placeholder for next build).
- Participant view (`isParticipantView`) still shows no checkboxes and no toolbar.

