
# Fix: Prevent Duplicate Donor Counting in update_donor_profile_from_order Trigger

## Problem
The `update_donor_profile_from_order` trigger fires on both `INSERT` and `UPDATE` of the `orders` table. It checks if `NEW.status IN ('succeeded', 'completed')` but does NOT check whether the status actually *changed* to that value. So any subsequent update to an already-succeeded order (e.g., updating `stripe_transfer_id`, `updated_at`, etc.) re-increments `donation_count`, `total_donations`, and `lifetime_value`.

## Fix
Add a guard at the top of the trigger function:
- On `INSERT`: proceed if status is succeeded/completed (current behavior, correct)
- On `UPDATE`: only proceed if the status is *transitioning* to succeeded/completed (i.e., `OLD.status` was NOT in those values but `NEW.status` is)

This is a single SQL migration that replaces the trigger function.

## Key Change (pseudocode)
```text
-- Skip if this is an UPDATE and the order was already succeeded/completed
IF TG_OP = 'UPDATE' AND OLD.status IN ('succeeded', 'completed') THEN
  RETURN NEW;
END IF;
```

## Technical Details

### Migration SQL
Replace the `update_donor_profile_from_order` function, adding the guard clause after the existing email/status check. The rest of the function body (upsert donor profile, calculate engagement, log activity) remains identical.

### Files
1. New database migration -- single `CREATE OR REPLACE FUNCTION` statement

No application code changes needed.
