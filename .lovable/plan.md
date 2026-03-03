
# Fix: Clean Up Duplicate Donation Activity Log Entries

## Problem
The old `update_donor_profile_from_order` trigger (before the guard clause fix) created duplicate `donation` entries in the `donor_activity_log` table every time an already-succeeded order was updated. The donor profile stats were corrected by `recalculate_donor_stats`, but the activity log entries were never cleaned up -- so the Giving History / Activity Timeline on the donor detail page still shows phantom donation events.

## Affected Data
- **stuartborders@gmail.com**: 2 orders, but 6 donation log entries (3 per order instead of 1)
- **six@donor.com**: 1 order with 3 log entries
- **donor@sparky.co**: 1 order with 3 log entries  
- **chris@absdabs.com**: 1 order with 2 log entries

## Fix
Run a single database migration that deletes duplicate `donation` activity log entries, keeping only the earliest entry per order_id per donor. This is a one-time data cleanup.

### SQL Logic
```sql
DELETE FROM donor_activity_log
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY donor_id, activity_data->>'order_id'
        ORDER BY created_at ASC
      ) as rn
    FROM donor_activity_log
    WHERE activity_type = 'donation'
      AND activity_data->>'order_id' IS NOT NULL
  ) ranked
  WHERE rn > 1
);
```

This keeps the first (earliest) activity log entry per order and removes all subsequent duplicates.

## Files
1. New database migration -- single DELETE statement to clean duplicates

No application code changes needed.
