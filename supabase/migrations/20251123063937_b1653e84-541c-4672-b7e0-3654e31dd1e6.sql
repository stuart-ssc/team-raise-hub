-- Add RFM scoring fields to donor_profiles
ALTER TABLE donor_profiles
ADD COLUMN rfm_recency_score INTEGER DEFAULT 0,
ADD COLUMN rfm_frequency_score INTEGER DEFAULT 0,
ADD COLUMN rfm_monetary_score INTEGER DEFAULT 0,
ADD COLUMN rfm_segment TEXT DEFAULT 'new',
ADD COLUMN segment_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create donor_segments table for custom segments
CREATE TABLE donor_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create donor_segment_campaigns table for tracking campaigns sent to segments
CREATE TABLE donor_segment_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES donor_segments(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  email_content TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for RFM queries
CREATE INDEX idx_donor_profiles_rfm ON donor_profiles(organization_id, rfm_segment, rfm_recency_score, rfm_frequency_score, rfm_monetary_score);

-- Add index for segment queries
CREATE INDEX idx_donor_segments_org ON donor_segments(organization_id);

-- Enable RLS on new tables
ALTER TABLE donor_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_segment_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for donor_segments
CREATE POLICY "Organization members can view segments"
  ON donor_segments FOR SELECT
  USING (user_belongs_to_organization(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

CREATE POLICY "Authorized users can manage segments"
  ON donor_segments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = donor_segments.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    ) OR is_system_admin(auth.uid())
  );

-- RLS policies for donor_segment_campaigns
CREATE POLICY "Organization members can view segment campaigns"
  ON donor_segment_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM donor_segments ds
      WHERE ds.id = donor_segment_campaigns.segment_id
      AND (user_belongs_to_organization(auth.uid(), ds.organization_id) OR is_system_admin(auth.uid()))
    )
  );

CREATE POLICY "Authorized users can manage segment campaigns"
  ON donor_segment_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM donor_segments ds
      JOIN organization_user ou ON ds.organization_id = ou.organization_id
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ds.id = donor_segment_campaigns.segment_id
      AND ou.user_id = auth.uid()
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    ) OR is_system_admin(auth.uid())
  );

-- Function to calculate RFM scores
CREATE OR REPLACE FUNCTION calculate_rfm_scores(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donor_record RECORD;
  recency_days INTEGER;
  recency_score INTEGER;
  frequency_score INTEGER;
  monetary_score INTEGER;
  segment_name TEXT;
BEGIN
  FOR donor_record IN
    SELECT id, last_donation_date, donation_count, lifetime_value
    FROM donor_profiles
    WHERE organization_id = org_id
  LOOP
    -- Calculate recency (days since last donation)
    recency_days := EXTRACT(DAY FROM (now() - donor_record.last_donation_date));
    
    -- Recency scoring (5 = most recent, 1 = least recent)
    IF recency_days <= 30 THEN recency_score := 5;
    ELSIF recency_days <= 90 THEN recency_score := 4;
    ELSIF recency_days <= 180 THEN recency_score := 3;
    ELSIF recency_days <= 365 THEN recency_score := 2;
    ELSE recency_score := 1;
    END IF;
    
    -- Frequency scoring (5 = highest frequency, 1 = lowest)
    IF donor_record.donation_count >= 10 THEN frequency_score := 5;
    ELSIF donor_record.donation_count >= 6 THEN frequency_score := 4;
    ELSIF donor_record.donation_count >= 3 THEN frequency_score := 3;
    ELSIF donor_record.donation_count = 2 THEN frequency_score := 2;
    ELSE frequency_score := 1;
    END IF;
    
    -- Monetary scoring (5 = highest value, 1 = lowest)
    IF donor_record.lifetime_value >= 100000 THEN monetary_score := 5;
    ELSIF donor_record.lifetime_value >= 50000 THEN monetary_score := 4;
    ELSIF donor_record.lifetime_value >= 10000 THEN monetary_score := 3;
    ELSIF donor_record.lifetime_value >= 5000 THEN monetary_score := 2;
    ELSE monetary_score := 1;
    END IF;
    
    -- Determine segment based on RFM scores
    IF recency_score >= 4 AND frequency_score >= 4 AND monetary_score >= 4 THEN
      segment_name := 'champions';
    ELSIF recency_score >= 3 AND frequency_score >= 3 AND monetary_score >= 3 THEN
      segment_name := 'loyal';
    ELSIF recency_score >= 4 AND frequency_score <= 2 AND monetary_score >= 3 THEN
      segment_name := 'big_spenders';
    ELSIF recency_score >= 4 AND frequency_score <= 2 THEN
      segment_name := 'promising';
    ELSIF recency_score >= 3 AND frequency_score <= 2 THEN
      segment_name := 'needs_attention';
    ELSIF recency_score <= 2 AND frequency_score >= 3 THEN
      segment_name := 'at_risk';
    ELSIF recency_score <= 2 THEN
      segment_name := 'lost';
    ELSE
      segment_name := 'new';
    END IF;
    
    -- Update donor profile with RFM scores
    UPDATE donor_profiles
    SET 
      rfm_recency_score = recency_score,
      rfm_frequency_score = frequency_score,
      rfm_monetary_score = monetary_score,
      rfm_segment = segment_name,
      segment_updated_at = now()
    WHERE id = donor_record.id;
  END LOOP;
END;
$$;