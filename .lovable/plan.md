

## Goal
Three small layout fixes on `/dashboard/my-fundraising`: remove the redundant top guardian banner, fix tab padding, and adjust hero card widths.

## Changes

All in **`src/pages/MyFundraising.tsx`**:

### 1. Remove top "Connected family" banner
- Delete the banner block rendered just under the page header (the one driven by `useConnectedGuardians`).
- Remove the now-unused `useConnectedGuardians` import and call.
- The full `ManageGuardiansCard` at the bottom of the page stays as-is — it's the canonical management surface.

### 2. Fix Active/Past/All tab padding
- Current `TabsTrigger` items clip the count text at narrow widths.
- Update each trigger to use `px-4 py-1.5` (and `whitespace-nowrap` to prevent wrap), and let the `TabsList` size to content (`inline-flex w-auto`) instead of stretching.
- Render counts inside a muted span: `Active <span className="ml-1.5 text-muted-foreground">({n})</span>` so the number breathes from the label.

### 3. Hero stat strip widths (40 / 30 / 30)
- Replace the current equal-width grid with a 10-column grid:
  ```
  grid grid-cols-1 lg:grid-cols-10 gap-4
  ```
- **Lifetime Raised** card: `lg:col-span-4` (40%).
- **Unique Supporters** card: `lg:col-span-3` (30%).
- **Best Rank** card: `lg:col-span-3` (30%).
- On mobile (`<lg`) all three stack full-width — matches mockup behavior.
- Inside the Lifetime Raised card, keep the sparkline right-aligned; it gets more horizontal room with the 40% width.

## Files touched
1. `src/pages/MyFundraising.tsx` — remove banner + import, fix Tabs styling, change hero grid to 10-col with 4/3/3 spans.

## Out of scope
- `ManageGuardiansCard` itself, parent view, campaign card layout, sort/view toggles, edge functions.

