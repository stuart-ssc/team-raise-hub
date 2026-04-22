

## Goal
Two small visual fixes on `/dashboard/donors/:id`:
1. Stop the engagement pill (e.g. "Low Engagement (26)") from changing color on hover.
2. Remove the stray separator line that appears under the last contact detail in the Contact Information card.

## Changes

### `src/pages/DonorProfile.tsx`

**1. Engagement badge — kill hover color shift**
The `Badge` default variant ships with `hover:bg-primary/80`, which fights the custom `bg-success/10 / bg-warning/10 / bg-muted` colors and produces a hover flash. Override by appending matching `hover:bg-*` classes inside `getEngagementColor`, plus `hover:text-*` to keep text stable:

```tsx
const getEngagementColor = (score: number) => {
  if (score >= 70) return "bg-success/10 text-success border-success/20 hover:bg-success/10 hover:text-success";
  if (score >= 40) return "bg-warning/10 text-warning border-warning/20 hover:bg-warning/10 hover:text-warning";
  return "bg-muted text-muted-foreground border-border hover:bg-muted hover:text-muted-foreground";
};
```

Result: pill stays exactly the same color when hovered.

**2. Contact Information — remove dangling separator**
The card unconditionally renders a `<Separator />` (line 518) between Phone and First Donation. When First/Last Donation aren't present (or when Phone is the bottom-most rendered field on screen), it leaves a horizontal line under the last detail with nothing below it.

Fix: remove that standalone separator. Add a conditional separator at the top of each subsequent block instead, so a divider only appears *between* two visible rows, never trailing:

```tsx
// Phone block — already wrapped in <> with <Separator /> before it. Keep.
// REMOVE the standalone <Separator /> currently between Phone and First Donation.

// First Donation block: wrap in fragment and only show separator if Phone exists
{donor.first_donation_date && (
  <>
    {donor.phone && <Separator />}
    <div className="flex items-center gap-3"> ... First Donation ... </div>
  </>
)}

// Last Donation block: separator only if Phone OR First Donation exists
{donor.last_donation_date && (
  <>
    {(donor.phone || donor.first_donation_date) && <Separator />}
    <div className="flex items-center gap-3"> ... Last Donation ... </div>
  </>
)}
```

Result: dividers always sit *between* details, never below the last one.

## Files touched
- `src/pages/DonorProfile.tsx`

## Verification
- Hovering the "Low Engagement (26)" pill no longer changes its background or text color (same for moderately/highly engaged variants).
- Contact Information card: no horizontal line below the bottom-most contact detail in any combination (email only / email+phone / email+phone+first / email+phone+first+last). Lines still separate adjacent rows when both are present.
- No layout shift in any other Contact Information state.

