
## Goal
Tighten the donor profile header: shrink the "Low Engagement" risk badge into a small pill placed below the donor name, and remove the email line that currently sits beneath the name.

## Changes
Single-file edit: `src/pages/DonorProfile.tsx` (header block of the loaded profile view).

1. **Remove email line** under the donor name in the header.
2. **Move the risk badge** (`Low Engagement` / `Medium` / `High Engagement Risk`) out of the right-side stats cluster and place it directly under the donor name as a small pill.
3. **Shrink the badge** to a compact pill style: smaller text, tighter padding, retain the existing semantic color (low = secondary/muted, medium = default, high = destructive).
4. Leave everything else (avatar, name, action buttons, stat cards, tabs) unchanged.

## Result
```text
[Avatar]  Donor Name
          • Low Engagement •     ← small pill, compact
          (no email line)
```

## Files touched
- `src/pages/DonorProfile.tsx`

## Verification
- `/dashboard/donors/:id` shows donor name with a small risk pill directly beneath it.
- Email no longer appears in the header (still available in the sidebar/contact section).
- Badge color still reflects risk level (low / medium / high).
- Mobile layout unaffected — pill wraps naturally beneath the name.
