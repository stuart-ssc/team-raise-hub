-- Drop existing view
DROP MATERIALIZED VIEW IF EXISTS roster_member_fundraising_stats;

-- Recreate with non-NULL campaign_id using COALESCE in the SELECT
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

-- Create simple unique index (no expressions) for CONCURRENTLY refresh
CREATE UNIQUE INDEX roster_member_fundraising_stats_unique_idx 
ON roster_member_fundraising_stats (roster_member_id, campaign_id);

-- Initial refresh
REFRESH MATERIALIZED VIEW roster_member_fundraising_stats;