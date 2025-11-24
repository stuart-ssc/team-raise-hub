-- Add engagement scoring columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS engagement_breadth_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_performance_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_vitality_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_segment text DEFAULT 'new',
ADD COLUMN IF NOT EXISTS engagement_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_partnership_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS linked_donors_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_donor_activity_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS segment_updated_at timestamp with time zone DEFAULT now();

-- Create function to calculate business engagement scores
CREATE OR REPLACE FUNCTION calculate_business_engagement_scores(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  business_record RECORD;
  vitality_days INTEGER;
  vitality_score INTEGER;
  breadth_score INTEGER;
  performance_score INTEGER;
  segment_name TEXT;
BEGIN
  FOR business_record IN
    SELECT 
      b.id,
      COUNT(DISTINCT bd.donor_id) FILTER (WHERE bd.blocked_at IS NULL) as donor_count,
      COALESCE(SUM(o.total_amount), 0) as total_value,
      MAX(o.created_at) as last_activity
    FROM businesses b
    LEFT JOIN business_donors bd ON b.id = bd.business_id AND bd.blocked_at IS NULL
    LEFT JOIN donor_profiles dp ON bd.donor_id = dp.id
    LEFT JOIN orders o ON dp.email = o.customer_email AND o.status IN ('succeeded', 'completed')
    LEFT JOIN campaigns c ON o.campaign_id = c.id
    LEFT JOIN groups g ON c.group_id = g.id
    WHERE g.organization_id = org_id OR b.id IN (
      SELECT DISTINCT bd2.business_id 
      FROM business_donors bd2 
      WHERE bd2.organization_id = org_id
    )
    GROUP BY b.id
  LOOP
    -- Calculate vitality (days since last donor activity)
    IF business_record.last_activity IS NOT NULL THEN
      vitality_days := EXTRACT(DAY FROM (now() - business_record.last_activity));
    ELSE
      vitality_days := 9999;
    END IF;
    
    -- Vitality scoring (5 = most recent, 1 = least recent)
    IF vitality_days <= 30 THEN vitality_score := 5;
    ELSIF vitality_days <= 90 THEN vitality_score := 4;
    ELSIF vitality_days <= 180 THEN vitality_score := 3;
    ELSIF vitality_days <= 365 THEN vitality_score := 2;
    ELSE vitality_score := 1;
    END IF;
    
    -- Breadth scoring (5 = highest donor count, 1 = lowest)
    IF business_record.donor_count >= 20 THEN breadth_score := 5;
    ELSIF business_record.donor_count >= 10 THEN breadth_score := 4;
    ELSIF business_record.donor_count >= 5 THEN breadth_score := 3;
    ELSIF business_record.donor_count >= 2 THEN breadth_score := 2;
    ELSE breadth_score := 1;
    END IF;
    
    -- Performance scoring (5 = highest value, 1 = lowest)
    IF business_record.total_value >= 500000 THEN performance_score := 5;
    ELSIF business_record.total_value >= 100000 THEN performance_score := 4;
    ELSIF business_record.total_value >= 25000 THEN performance_score := 3;
    ELSIF business_record.total_value >= 5000 THEN performance_score := 2;
    ELSE performance_score := 1;
    END IF;
    
    -- Determine segment based on BPV scores
    IF vitality_score >= 4 AND breadth_score >= 4 AND performance_score >= 4 THEN
      segment_name := 'champion_partners';
    ELSIF vitality_score >= 3 AND breadth_score >= 3 AND performance_score >= 3 THEN
      segment_name := 'engaged_partners';
    ELSIF vitality_score >= 4 AND breadth_score <= 2 AND performance_score >= 3 THEN
      segment_name := 'high_value_focused';
    ELSIF vitality_score >= 4 AND breadth_score <= 2 THEN
      segment_name := 'emerging_partners';
    ELSIF vitality_score >= 3 AND breadth_score <= 2 THEN
      segment_name := 'needs_cultivation';
    ELSIF vitality_score <= 2 AND breadth_score >= 3 THEN
      segment_name := 'at_risk';
    ELSIF vitality_score <= 2 THEN
      segment_name := 'dormant';
    ELSE
      segment_name := 'new';
    END IF;
    
    -- Update business with engagement scores
    UPDATE businesses
    SET 
      engagement_vitality_score = vitality_score,
      engagement_breadth_score = breadth_score,
      engagement_performance_score = performance_score,
      engagement_segment = segment_name,
      engagement_score = LEAST(100, (vitality_score * 20 + breadth_score * 20 + performance_score * 20)),
      total_partnership_value = business_record.total_value,
      linked_donors_count = business_record.donor_count,
      last_donor_activity_date = business_record.last_activity,
      segment_updated_at = now()
    WHERE id = business_record.id;
  END LOOP;
END;
$$;