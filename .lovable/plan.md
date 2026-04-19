

## Issue
Breadcrumb bar (`DashboardBreadcrumbs`) uses `max-w-7xl mx-auto` for its inner content, but the header above it and main content below use full-width with `px-6` padding. This causes visual misalignment — the breadcrumb's "Home" sits at a different x-position than the header title and page content.

## Root cause
`src/components/DashboardBreadcrumbs.tsx`:
```tsx
<div className="border-b border-primary/20 bg-primary/10 px-6 py-2">
  <div className="max-w-7xl mx-auto">  ← centers content, misaligning it
```

The skeleton variant in `DashboardPageLayout.tsx` has the same `max-w-7xl mx-auto` wrapper.

## Fix
Remove the `max-w-7xl mx-auto` wrapper in both places so breadcrumb content aligns with the `px-6` padding used by the header and `<main>`.

### Files
1. `src/components/DashboardBreadcrumbs.tsx` — remove inner `<div className="max-w-7xl mx-auto">` wrapper, keep `<Breadcrumb>` directly inside the padded outer div.
2. `src/components/DashboardPageLayout.tsx` — same fix for the loading skeleton variant (lines ~88-94).

## Out of scope
- Header, main content padding, breadcrumb colors/styles — unchanged.

