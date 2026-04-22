

## Goal
Update the My Fundraising page heading to match the styling pattern used on the Donors page ("My Supporters").

## Changes

**File:** `src/pages/MyFundraising.tsx`

Replace the current heading block (lines 587–591) with the Donors-page pattern:

```tsx
<div>
  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
    <Trophy className="h-8 w-8 text-primary" />
    {pageTitle}
  </h1>
  <p className="text-muted-foreground mt-1">{subheading}</p>
</div>
```

### Specifics
- Drop `text-4xl md:text-5xl font-semibold tracking-tight` → use `text-3xl font-bold`.
- Add a primary-colored icon (`Trophy`, already imported) at `h-8 w-8 text-primary` next to the title using `flex items-center gap-2`.
- Subtitle becomes `text-muted-foreground mt-1` (drop `max-w-2xl` to match Donors).
- Keep the existing `pageTitle` / `subheading` logic and the right-side "Upload donors" button untouched.

## Out of scope
- Donors page itself
- Breadcrumbs, hero cards, campaign cards, filter toolbar
- Any other page headings

## Files touched
1. `src/pages/MyFundraising.tsx` — heading block only.

