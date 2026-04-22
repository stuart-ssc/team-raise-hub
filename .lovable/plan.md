

## Why the numbers don't match

The two pages are measuring two **completely different** things, and both are working correctly:

### Donors page = "people in your contact book" (2)
Counts every donor record you can see — including the **2 donors you uploaded via the CSV importer** (Donor Five, Donor Six). They have no purchase history; they're prospects/contacts.

### My Fundraising → "Lifetime Raised" / "Supporters" (0)
Counts only **completed orders** (`status IN ('succeeded','completed')`) where `attributed_roster_member_id = your roster member id`. Source: the `roster_member_fundraising_stats` materialized view, computed from the `orders` table by the `get-roster-member-stats` edge function.

Your two uploaded donors have **never placed an order**, so:
- they correctly appear in your contact book (Donors page), and
- they correctly contribute $0 raised and 0 supporters on My Fundraising.

This is the intended split: **Donors = relationships**, **My Fundraising = money actually raised**. Once one of those donors completes a purchase through your personal link, they'll start counting on My Fundraising too.

## What we recommend changing (small UX fix, optional)

To prevent this confusion in the future, add a tiny clarifier on the My Fundraising stat cards so it's obvious these are donation-based, not contact-based.

### Plan
1. In `src/pages/MyFundraising.tsx`:
   - **`SupportersCard`** — change the small label under the count from "Unique supporters" to "Donors who gave". Add a one-line muted helper: "Contacts you've added live in the Donors page."
   - **`LifetimeRaisedCard`** — leave the title alone, but add a muted tagline: "Total from completed orders attributed to your link."
2. No data, RLS, or edge-function changes — both numbers are accurate.

### Files touched
- `src/pages/MyFundraising.tsx` (copy tweaks only — `SupportersCard` and `LifetimeRaisedCard` components near the bottom of the file).

### Verification
- My Fundraising still shows $0 / 0 supporters for Taylor (correct — no attributed orders yet).
- The new helper copy makes it clear these are gift-based metrics.
- After a test donation through Taylor's personal link, both numbers go up; the Donors page count is unaffected by the donation itself but already includes that donor via the order-based path.

