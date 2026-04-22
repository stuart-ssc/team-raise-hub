

## Goal
Make the "My Supports" (My Fundraising) page content span the full width of the main content area, matching other dashboard pages.

## Investigation
Looking at `src/pages/MyFundraising.tsx`, the content is likely wrapped in a constrained container (e.g. `max-w-*` or `container mx-auto`) inside the `DashboardPageLayout`. Other dashboard pages render their content directly without an inner max-width wrapper, so they fill `main`'s padding box edge-to-edge.

## Change

### `src/pages/MyFundraising.tsx`
- Remove the constraining wrapper around the page body so its children fill the available width inside `<main className="flex-1 overflow-y-auto p-6">` (provided by `DashboardPageLayout`).
- Specifically: locate the top-level wrapper inside the `<DashboardPageLayout>` return (likely a `div` with classes like `max-w-7xl mx-auto` or `container mx-auto px-…`) and replace it with a plain `<div className="space-y-6">` (or whatever vertical-spacing utility is already in use), so width is 100%.
- Keep all internal spacing/grid utilities intact — only the outer width constraint is removed.
- Do not touch `DashboardPageLayout` (it already provides the standard `p-6` padding used on every dashboard page).

## Verification
- Navigate to `/dashboard/my-fundraising` at desktop widths (≥1280px). The campaign cards, stat tiles, and any tables now extend to the same right edge as content on `/dashboard`, `/dashboard/orders`, etc.
- No horizontal scrollbar appears.
- Mobile layout is unchanged (cards still stack and respect the layout's `p-6` padding).

## Files touched
1. `src/pages/MyFundraising.tsx` — remove outer max-width container.

