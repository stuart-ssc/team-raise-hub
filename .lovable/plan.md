

## Goal
Make the Donors / "My Supporters" page span the full width of the main content area, matching other dashboard pages.

## Root cause
`src/pages/Donors.tsx` wraps its content in `<div className="max-w-7xl mx-auto space-y-6">` in two places (the loading skeleton at line 340 and the main return at line 355). At a 1427px viewport, this caps content at ~1280px and leaves visible empty space on the right.

## Change

### `src/pages/Donors.tsx`
- Line 340 (loading skeleton wrapper): change `max-w-7xl mx-auto space-y-6` → `space-y-6`.
- Line 355 (main content wrapper): change `max-w-7xl mx-auto space-y-6` → `space-y-6`.
- No other changes — internal grid/flex layouts already adapt to full width.

## Verification
- `/dashboard/donors` content (header, stat tiles, search/filter bar, donors list card) extends to the same right edge as `/dashboard` and `/dashboard/orders`.
- Stat tiles still use the existing 4-column grid and now have more breathing room per card.
- No horizontal scrollbar; mobile layout unchanged (the constraint only affected desktop widths).

## Files touched
1. `src/pages/Donors.tsx` — remove `max-w-7xl mx-auto` from both wrappers.

