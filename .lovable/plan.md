

## Goal
On mobile (single-column layout), display the right sidebar cards (Contact Information, Business Affiliations, List Memberships, Notes) **before** the left column cards (Stats, Giving History, AI Insights, Activity Timeline, Communication History). On desktop (`lg` and up), keep the current two-column layout unchanged.

## Approach

In `src/pages/DonorProfile.tsx`, the layout uses a single `grid grid-cols-1 lg:grid-cols-3` with the left column (`lg:col-span-2`) declared first in source order. On mobile this stacks left column → right column. To reverse only on mobile while preserving desktop column placement, use Tailwind's `order-*` utilities.

### Changes to `src/pages/DonorProfile.tsx`

1. On the **left column wrapper** (`<div className="lg:col-span-2 space-y-6">`):
   - Add `order-2 lg:order-1` so it renders second on mobile, first on desktop.

2. On the **right column wrapper** (the sibling `<div className="space-y-6">` containing Contact Information, Business Affiliations, List Memberships, Notes):
   - Add `order-1 lg:order-2` so it renders first on mobile, second on desktop.

No other layout, data, or component changes needed.

## Files touched
- `src/pages/DonorProfile.tsx`

## Verification
- Mobile (<1024px): cards appear in order — Contact Information, Business Affiliations, List Memberships, Notes, then Stats, Giving History, AI Insights, Activity Timeline, Communication History.
- Desktop (≥1024px): unchanged — left column (stats + collapsibles) on the left spanning 2 columns, right sidebar on the right.
- No regressions to collapsible behavior, default open/closed states, or AI Insights blue styling.

