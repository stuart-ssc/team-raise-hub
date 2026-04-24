

## Goal
Make `/dashboard/messages` use the full content width like other dashboard pages, matching the recent Reports fix.

## Change — `src/pages/Messages.tsx` (or equivalent)

Locate the wrapping container that constrains width (likely `max-w-7xl mx-auto` or similar) and remove the width cap, keeping vertical spacing utilities intact.

- Replace `<div className="max-w-7xl mx-auto space-y-6">` (or analogous) with `<div className="space-y-6">`.
- Apply to both the loading skeleton branch and the main render branch if both exist.

The outer `<main className="flex-1 overflow-y-auto p-6">` from `DashboardPageLayout` already provides standard page padding, so content will stretch to fill the available width.

## Verification
- `/dashboard/messages` content (conversation list, thread view, composer) spans the full content area at desktop widths, matching Campaigns / Donors / Dashboard / Reports.
- No change to mobile layout.
- Loading skeleton also stretches full width.

