

## Goal
Make the Donor detail page (`/dashboard/donors/:id`) span the full width of the dashboard content area, matching the other dashboard pages.

## Cause
`src/pages/DonorProfile.tsx` wraps its content in:
```
<div className="max-w-5xl mx-auto space-y-6">
```
That `max-w-5xl mx-auto` caps the page at ~1024px and centers it, leaving large empty gutters on wider screens. Other dashboard pages let the layout's own `p-6` define the width and don't add this constraint.

`BusinessProfile.tsx` does not have this constraint — it's already full width — so no change is needed there.

## Fix
Single-file edit in `src/pages/DonorProfile.tsx`:
- Replace `<div className="max-w-5xl mx-auto space-y-6">` with `<div className="space-y-6">`.
- Leave all child layout (the `lg:grid-cols-3` 2/1 split for main content + sidebar) unchanged so the existing two-column structure simply expands to fill the available width.

No other files touched. No layout, hook, or RLS changes.

## Verification
- `/dashboard/donors/:id` content now extends to the same right edge as `/dashboard/donors` and other dashboard pages at 1427px viewport.
- Two-column grid (insights/activity vs. side panel) widens proportionally; cards remain readable.
- Mobile (<768px) is unaffected — grid already collapses to a single column.
- Business profile page is unchanged (already full width).

