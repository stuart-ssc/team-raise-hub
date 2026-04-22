

## Goal
Make the Donors page agree with My Fundraising: `test_archived`, `refunded`, and `cancelled` orders should not contribute to donor lifetime stats. Repair the existing stale numbers and harden the trigger so future status downgrades correctly decrement.

## Changes

### 1. Migration — harden `update_donor_profile_from_order` trigger
Replace the function so it handles three cases instead of one:

- **INSERT with successful status** → add to donor stats (today's behavior).
- **UPDATE transitioning INTO `succeeded`/`completed`** (from anything else) → add to donor stats.
- **UPDATE transitioning OUT OF `succeeded`/`completed`** (to `test_archived`, `refunded`, `cancelled`, `failed`, etc.) → **subtract** the prior order amount, decrement `donation_count`, recompute `last_donation_date` from remaining successful orders, and recompute `engagement_score`. Floor totals at 0 to guard against drift.
- **UPDATE between two successful statuses** (e.g. `succeeded` → `completed`) → no-op (current guard preserved).

The activity log entry for `'donation'` is only inserted on the add path. On the subtract path, log a `'donation_reversed'` activity with the order id and amount so admins can see the history.

### 2. Migration — one-time data repair
Call the existing `recalculate_donor_stats(p_organization_id)` function for **all organizations** (pass `NULL`) so every donor's `total_donations`, `donation_count`, `lifetime_value`, `first_donation_date`, and `last_donation_date` are rebuilt from `orders WHERE status IN ('succeeded','completed')`.

Note: the existing `recalculate_donor_stats` function only filters on `status = 'succeeded'`. We'll update it in the same migration to include `'completed'` too, so it matches the trigger and the materialized view.

### 3. No frontend changes
Donors page will automatically show $0 / 0 donations for Donor Five and Donor Six after the repair. My Fundraising remains unchanged (already correct).

## Files touched
- `supabase/migrations/<new>.sql` — replaces `update_donor_profile_from_order`, updates `recalculate_donor_stats` to include `'completed'`, and runs `SELECT recalculate_donor_stats(NULL);` once at the end of the migration.

## Verification
- After migration: Donors page shows Donor Five and Donor Six with `$0` / `0 donations` (matches My Fundraising).
- Other donors with real `succeeded`/`completed` orders are unchanged (totals match the sum of their order items).
- Manually flip a test order from `completed` → `test_archived`: donor's `total_donations` and `donation_count` drop by exactly that order's amount; a `donation_reversed` row appears in `donor_activity_log`.
- Flip the same order back to `completed`: stats restore; a fresh `donation` activity row is logged.
- My Fundraising for Taylor still shows `$0` / `0 supporters` (unchanged — view already filtered correctly).

