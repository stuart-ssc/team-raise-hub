-- Create helper function to calculate order items total
CREATE OR REPLACE FUNCTION public.calculate_order_items_total(items_json JSONB)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total NUMERIC := 0;
  item RECORD;
BEGIN
  IF items_json IS NULL THEN
    RETURN 0;
  END IF;
  
  FOR item IN SELECT * FROM jsonb_to_recordset(items_json) AS x(cost NUMERIC, quantity INTEGER)
  LOOP
    total := total + COALESCE(item.cost, 0) * COALESCE(item.quantity, 1);
  END LOOP;
  RETURN total;
END;
$$;

-- Recreate materialized view to use items total
DROP MATERIALIZED VIEW IF EXISTS roster_member_fundraising_stats;

CREATE MATERIALIZED VIEW roster_member_fundraising_stats AS
SELECT 
    su.id AS roster_member_id,
    su.roster_id,
    su.user_id,
    r.group_id,
    c.id AS campaign_id,
    count(DISTINCT o.id) AS donation_count,
    COALESCE(sum(calculate_order_items_total(o.items)), (0)::numeric) AS total_raised,
    COALESCE(avg(calculate_order_items_total(o.items)), (0)::numeric) AS avg_donation,
    max(o.created_at) AS last_donation_date,
    count(DISTINCT o.customer_email) AS unique_supporters
FROM school_user su
JOIN rosters r ON r.id = su.roster_id
LEFT JOIN campaigns c ON c.group_id = r.group_id AND c.enable_roster_attribution = true
LEFT JOIN orders o ON o.attributed_roster_member_id = su.id 
    AND o.campaign_id = c.id 
    AND o.status = ANY (ARRAY['succeeded'::text, 'completed'::text])
GROUP BY su.id, su.roster_id, su.user_id, r.group_id, c.id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS roster_member_fundraising_stats_unique_idx 
ON roster_member_fundraising_stats (roster_member_id, campaign_id);

-- Refresh the view with data
REFRESH MATERIALIZED VIEW roster_member_fundraising_stats;