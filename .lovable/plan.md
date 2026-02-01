

## Fix: Checkout Fails Due to Materialized View Refresh Error

### Problem
When you try to complete a checkout, the order creation triggers a database function that attempts to refresh a materialized view (`roster_member_fundraising_stats`). This refresh fails with error code 55000 because the unique index uses a `COALESCE` expression, which PostgreSQL doesn't support for concurrent refresh.

### Root Cause
PostgreSQL's `REFRESH MATERIALIZED VIEW CONCURRENTLY` requires a unique index on **actual columns**, not expressions. The current index uses:
```sql
COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid)
```

This expression-based index cannot be used for concurrent refresh.

### Solution
Modify the materialized view to handle NULL campaign_ids in the view definition itself (using COALESCE), then create a simple unique index on the plain columns.

### Changes Required

**Database Migration:**

1. Drop the existing materialized view
2. Recreate it with a guaranteed non-NULL `campaign_id` using COALESCE in the SELECT
3. Create a simple unique index on `(roster_member_id, campaign_id)` without expressions

```sql
-- Drop existing view
DROP MATERIALIZED VIEW IF EXISTS roster_member_fundraising_stats;

-- Recreate with non-NULL campaign_id
CREATE MATERIALIZED VIEW roster_member_fundraising_stats AS
SELECT 
    ou.id AS roster_member_id,
    ou.roster_id,
    ou.user_id,
    r.group_id,
    COALESCE(c.id, '00000000-0000-0000-0000-000000000000'::uuid) AS campaign_id,
    count(DISTINCT o.id) AS donation_count,
    COALESCE(sum(calculate_order_items_total(o.items)), 0) AS total_raised,
    COALESCE(avg(calculate_order_items_total(o.items)), 0) AS avg_donation,
    max(o.created_at) AS last_donation_date,
    count(DISTINCT o.customer_email) AS unique_supporters
FROM organization_user ou
JOIN rosters r ON r.id = ou.roster_id
LEFT JOIN campaigns c ON c.group_id = r.group_id AND c.enable_roster_attribution = true
LEFT JOIN orders o ON o.attributed_roster_member_id = ou.id 
    AND o.campaign_id = c.id 
    AND o.status = ANY (ARRAY['succeeded', 'completed'])
GROUP BY ou.id, ou.roster_id, ou.user_id, r.group_id, c.id;

-- Create simple unique index (no expressions)
CREATE UNIQUE INDEX roster_member_fundraising_stats_unique_idx 
ON roster_member_fundraising_stats (roster_member_id, campaign_id);

-- Refresh the view
REFRESH MATERIALIZED VIEW roster_member_fundraising_stats;
```

### Technical Details

| Component | Current Issue | Fix |
|-----------|--------------|-----|
| Materialized View | `campaign_id` can be NULL | Use COALESCE in SELECT to guarantee non-NULL |
| Unique Index | Uses `COALESCE(campaign_id, ...)` expression | Simple index on `(roster_member_id, campaign_id)` |
| Concurrent Refresh | Fails with error 55000 | Will work after fix |

### Result
- Checkout will complete successfully
- Orders will be created without database errors
- The materialized view will refresh correctly when orders are placed

