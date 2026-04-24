

## Goal
Make `/dashboard/reports` use the full content width like other dashboard pages (Campaigns, Donors, Dashboard) instead of being constrained to `max-w-7xl`.

## Change — `src/pages/Reports.tsx`

Remove the `max-w-7xl mx-auto` wrapper in both the loading state (line 469) and the main render (line 497). Keep the `space-y-6` utility by moving it up to the parent, so the layout becomes:

- Loading branch: replace `<div className="max-w-7xl mx-auto space-y-6">` with `<div className="space-y-6">`.
- Main branch: replace `<div className="max-w-7xl mx-auto space-y-6">` with `<div className="space-y-6">`.

The outer `<main className="flex-1 overflow-y-auto p-6">` already provides the standard page padding used by other pages, so content will now stretch to fill available width.

## Verification
- `/dashboard/reports` content (title row, KPI tiles, charts, campaign table) spans the full content area at all desktop widths, matching Campaigns / Donors / Dashboard.
- No change to mobile layout (max-w cap had no effect there).
- Loading skeleton also stretches full width consistently.

