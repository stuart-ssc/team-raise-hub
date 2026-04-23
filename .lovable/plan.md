
## Goal
Make the donor-card selection control impossible to miss on `/dashboard/donors`. The current checkbox code exists, but the visual treatment is still too subtle or getting lost in the card header layout. Replace it with an explicit, pinned top-left selection chip that always shows.

## Changes

### `src/pages/Donors.tsx`

**1. Move the per-card checkbox out of the header flow**
- Stop rendering the donor-card checkbox inline inside the `flex items-start justify-between` row.
- Make each donor `<Card>` `relative`.
- Render the selection control as an absolutely positioned element in the card’s top-left (`absolute left-4 top-4 z-10`), so it no longer depends on the text/badge row layout.

**2. Turn the checkbox into a clearly visible selection chip**
- Wrap the checkbox in a bordered, high-contrast chip such as:
  - `inline-flex items-center gap-2 rounded-md border bg-background shadow-sm px-2 py-1`
  - selected state: `border-primary bg-primary/10`
  - unselected state: `border-border bg-muted/60 hover:bg-muted`
- Add a tiny label next to it like `Select` on donor cards so the affordance reads as an action, not a missing icon.
- Keep the actual `<Checkbox>` inside the chip and preserve `checked`, `onCheckedChange`, and `aria-label`.

**3. Prevent navigation conflicts**
- Keep `stopPropagation()` on the chip wrapper.
- Preserve existing behavior:
  - no selection active: card body click navigates
  - selection active: card body click toggles selection
  - clicking the checkbox chip itself only changes selection

**4. Keep header bulk-select consistent**
- Apply the same stronger visual treatment to the header “Select all on this page” control.
- Keep the indeterminate state logic exactly as-is.

**5. Clean up spacing so content doesn’t collide**
- Add enough top padding to card content/header text so the new top-left chip does not overlap the donor name.
- Keep the engagement badge in the top-right.

## Files touched
- `src/pages/Donors.tsx`

## Technical details
```text
Card (relative)
├─ absolute top-left selection chip [Checkbox + "Select"]
├─ top row
│  ├─ donor name/email block
│  └─ engagement badge
└─ stats/content
```

Recommended approach:
- Card root: add `relative`
- Selection chip: `absolute left-4 top-4 z-10`
- Name block/container: add left/top spacing as needed (`pl-16` or `pt-8`) so layout stays clean

## Verification
- Every donor card visibly shows a top-left selection chip, even when unchecked.
- The chip is clearly visible on a white card without relying on subtle borders.
- Clicking the chip selects the donor and reveals the bulk action toolbar.
- Multiple donors can still be selected.
- Header “Select all on this page” remains visible and works with checked + indeterminate states.
- Participant view still shows no selection controls.
