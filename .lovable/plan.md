

## Goal
The selection checkboxes are still in the code on each donor card (top-left of each card, `h-5 w-5` with a primary-colored border), but on the white card background an empty checkbox reads as a tiny faint square and is easy to miss — especially after the three-dot menu was removed and nothing else lives in that corner. Make the checkbox unmistakably visible so the user can see and use it.

## Changes

### `src/pages/Donors.tsx` — donor card checkbox visibility

**1. Make the checkbox visually prominent**
- Wrap the per-card `<Checkbox>` in a small rounded container with a subtle muted background (`bg-muted/40 hover:bg-muted rounded-md p-1.5`) so the empty checkbox sits in a visible "chip" instead of floating against white.
- Keep size at `h-5 w-5`, keep position top-left of the card, keep `border-primary` so the outline reads clearly.
- Selected state: container becomes `bg-primary/10` to reinforce the selection.

**2. Header "Select all on this page" checkbox**
- Apply the same chip treatment to the header checkbox so the bulk-selection affordance is consistent and discoverable.

**3. No logic changes**
- Card click behavior, select-mode toggle, navigation, bulk action toolbar, and participant view all stay exactly as they are.

## Files touched
- `src/pages/Donors.tsx`

## Verification
- On `/dashboard/donors`, every donor card shows a clearly visible checkbox chip in its top-left corner, even when unchecked.
- Clicking the checkbox selects the donor and reveals the floating bottom toolbar (Add Tags · Add to List · Contact about Fundraiser · Send Email · Export CSV · Clear).
- Selected cards show the filled primary checkbox inside a tinted chip plus the existing card ring.
- Header "Select all on this page" checkbox is equally visible and toggles all visible donors.
- Participant view is unchanged.
