-- First drop the view if it somehow exists, then recreate it with net amount calculation
DROP MATERIALIZED VIEW IF EXISTS roster_member_fundraising_stats;

CREATE MATERIALIZED VIEW roster_member_fundraising_stats AS
SELECT 
    su.id AS roster_member_id,
    su.roster_id,
    su.user_id,
    r.group_id,
    c.id AS campaign_id,
    count(DISTINCT o.id) AS donation_count,
    COALESCE(sum(o.total_amount - COALESCE(o.platform_fee_amount, 0)), (0)::numeric) AS total_raised,
    COALESCE(avg(o.total_amount - COALESCE(o.platform_fee_amount, 0)), (0)::numeric) AS avg_donation,
    max(o.created_at) AS last_donation_date,
    count(DISTINCT o.customer_email) AS unique_supporters
FROM school_user su
JOIN rosters r ON r.id = su.roster_id
LEFT JOIN campaigns c ON c.group_id = r.group_id AND c.enable_roster_attribution = true
LEFT JOIN orders o ON o.attributed_roster_member_id = su.id 
    AND o.campaign_id = c.id 
    AND o.status = ANY (ARRAY['succeeded'::text, 'completed'::text])
GROUP BY su.id, su.roster_id, su.user_id, r.group_id, c.id;