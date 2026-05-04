## Issue

The "Most popular" toggle on a campaign item is only rendered on the Sponsorship landing template. The Golf Scramble fundraiser uses the **Event** landing template (`EventLanding.tsx`), whose `TicketCard` ignores the `is_most_popular` flag, so the Foursome shows no badge.

## Fix

Update `src/components/campaign-landing/event/EventLanding.tsx`:

- In `TicketCard`, read `item.is_most_popular`.
- When true, add a "Most popular" badge in the card header (top-right or above the title) using the existing event accent color, mirroring the styling used in `SponsorshipLanding.tsx` (line ~569).
- Optionally add a subtle ring/border highlight on the card so it visually stands out, consistent with the event template's minimalist style.

## Bonus check

While in the file, verify the same flag is also surfaced on the merchandise and donation landing templates. If they likewise omit it, add the same badge treatment so the toggle works consistently across all fundraiser types.

No DB or schema changes — the field already exists and is being saved correctly.
