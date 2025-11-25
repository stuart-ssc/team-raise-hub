-- Add roster attribution support to campaigns
ALTER TABLE campaigns 
ADD COLUMN enable_roster_attribution BOOLEAN DEFAULT FALSE;

-- Add attributed roster member to orders
ALTER TABLE orders 
ADD COLUMN attributed_roster_member_id UUID REFERENCES school_user(id);

-- Create table for roster member campaign link slugs
CREATE TABLE roster_member_campaign_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  roster_member_id UUID REFERENCES school_user(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, roster_member_id),
  UNIQUE(campaign_id, slug)
);

-- Enable RLS on roster_member_campaign_links
ALTER TABLE roster_member_campaign_links ENABLE ROW LEVEL SECURITY;

-- Public can view links for active campaigns
CREATE POLICY "Public can view roster member links for active campaigns"
ON roster_member_campaign_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = roster_member_campaign_links.campaign_id
    AND c.status = true
  )
);

-- Organization users can manage links
CREATE POLICY "Organization users can manage roster member links"
ON roster_member_campaign_links
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    JOIN groups g ON c.group_id = g.id
    WHERE c.id = roster_member_campaign_links.campaign_id
    AND user_belongs_to_organization(auth.uid(), g.organization_id)
  )
);

-- Create materialized view for roster member fundraising stats
CREATE MATERIALIZED VIEW roster_member_fundraising_stats AS
SELECT 
  su.id AS roster_member_id,
  su.roster_id,
  su.user_id,
  r.group_id,
  c.id AS campaign_id,
  COUNT(DISTINCT o.id) AS donation_count,
  COALESCE(SUM(o.total_amount), 0) AS total_raised,
  COALESCE(AVG(o.total_amount), 0) AS avg_donation,
  MAX(o.created_at) AS last_donation_date,
  COUNT(DISTINCT o.customer_email) AS unique_supporters
FROM school_user su
JOIN rosters r ON r.id = su.roster_id
LEFT JOIN campaigns c ON c.group_id = r.group_id AND c.enable_roster_attribution = true
LEFT JOIN orders o ON o.attributed_roster_member_id = su.id AND o.campaign_id = c.id AND o.status IN ('succeeded', 'completed')
GROUP BY su.id, su.roster_id, su.user_id, r.group_id, c.id;

-- Create index for performance
CREATE INDEX idx_roster_member_campaign_links_campaign ON roster_member_campaign_links(campaign_id);
CREATE INDEX idx_roster_member_campaign_links_member ON roster_member_campaign_links(roster_member_id);
CREATE INDEX idx_orders_attributed_roster_member ON orders(attributed_roster_member_id);
CREATE UNIQUE INDEX idx_roster_member_fundraising_stats ON roster_member_fundraising_stats(roster_member_id, campaign_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_roster_fundraising_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY roster_member_fundraising_stats;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to refresh stats when orders are created/updated
CREATE TRIGGER refresh_roster_stats_on_order
AFTER INSERT OR UPDATE OF attributed_roster_member_id, status ON orders
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_roster_fundraising_stats();