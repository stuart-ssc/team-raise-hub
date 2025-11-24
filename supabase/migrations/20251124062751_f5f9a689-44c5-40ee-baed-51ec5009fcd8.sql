-- Create business_activity_log table to track all business activities
CREATE TABLE IF NOT EXISTS public.business_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create business_insights table to store AI-generated partnership insights
CREATE TABLE IF NOT EXISTS public.business_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  partnership_health_score INTEGER DEFAULT 0,
  risk_level TEXT,
  expansion_potential TEXT,
  optimal_outreach_date DATE,
  priority_score INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_activity_log_business_id ON public.business_activity_log(business_id);
CREATE INDEX IF NOT EXISTS idx_business_activity_log_created_at ON public.business_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_insights_business_id ON public.business_insights(business_id);
CREATE INDEX IF NOT EXISTS idx_business_insights_organization_id ON public.business_insights(organization_id);

-- Enable RLS
ALTER TABLE public.business_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_activity_log
CREATE POLICY "Organization members can view activity logs"
  ON public.business_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_businesses ob
      WHERE ob.business_id = business_activity_log.business_id
      AND user_belongs_to_organization(auth.uid(), ob.organization_id)
    )
    OR is_system_admin(auth.uid())
  );

CREATE POLICY "System can insert activity logs"
  ON public.business_activity_log
  FOR INSERT
  WITH CHECK (is_system_admin(auth.uid()));

-- RLS Policies for business_insights
CREATE POLICY "Organization members can view insights"
  ON public.business_insights
  FOR SELECT
  USING (
    user_belongs_to_organization(auth.uid(), organization_id)
    OR is_system_admin(auth.uid())
  );

CREATE POLICY "Authorized users can manage insights"
  ON public.business_insights
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_user ou
      JOIN public.user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = business_insights.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
    OR is_system_admin(auth.uid())
  );

-- Function to track business engagement changes
CREATE OR REPLACE FUNCTION public.track_business_engagement_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log engagement score changes
  IF OLD.engagement_score IS DISTINCT FROM NEW.engagement_score THEN
    INSERT INTO public.business_activity_log (business_id, activity_type, activity_data)
    VALUES (
      NEW.id,
      'engagement_score_changed',
      jsonb_build_object(
        'old_score', OLD.engagement_score,
        'new_score', NEW.engagement_score,
        'changed_at', now()
      )
    );
  END IF;
  
  -- Log segment changes
  IF OLD.engagement_segment IS DISTINCT FROM NEW.engagement_segment THEN
    INSERT INTO public.business_activity_log (business_id, activity_type, activity_data)
    VALUES (
      NEW.id,
      'segment_changed',
      jsonb_build_object(
        'old_segment', OLD.engagement_segment,
        'new_segment', NEW.engagement_segment,
        'changed_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to track business-donor link changes
CREATE OR REPLACE FUNCTION public.track_business_donor_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donor_name TEXT;
BEGIN
  -- Get donor name
  SELECT COALESCE(first_name || ' ' || last_name, email) INTO donor_name
  FROM public.donor_profiles
  WHERE id = COALESCE(NEW.donor_id, OLD.donor_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.business_activity_log (business_id, activity_type, activity_data)
    VALUES (
      NEW.business_id,
      'donor_linked',
      jsonb_build_object(
        'donor_id', NEW.donor_id,
        'donor_name', donor_name,
        'role', NEW.role,
        'is_primary_contact', NEW.is_primary_contact,
        'linked_at', NEW.linked_at
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.business_activity_log (business_id, activity_type, activity_data)
    VALUES (
      OLD.business_id,
      'donor_unlinked',
      jsonb_build_object(
        'donor_id', OLD.donor_id,
        'donor_name', donor_name,
        'role', OLD.role,
        'was_primary_contact', OLD.is_primary_contact,
        'unlinked_at', now()
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log primary contact changes
    IF OLD.is_primary_contact IS DISTINCT FROM NEW.is_primary_contact AND NEW.is_primary_contact = true THEN
      INSERT INTO public.business_activity_log (business_id, activity_type, activity_data)
      VALUES (
        NEW.business_id,
        'primary_contact_changed',
        jsonb_build_object(
          'donor_id', NEW.donor_id,
          'donor_name', donor_name,
          'role', NEW.role,
          'changed_at', now()
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function to log donations from linked donors
CREATE OR REPLACE FUNCTION public.log_business_donations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donor_record RECORD;
  campaign_name TEXT;
BEGIN
  -- Only log successful business purchases
  IF NEW.status IN ('succeeded', 'completed') AND NEW.business_id IS NOT NULL THEN
    -- Get donor info
    SELECT dp.id, dp.first_name, dp.last_name, dp.email
    INTO donor_record
    FROM public.donor_profiles dp
    WHERE dp.email = NEW.customer_email
    LIMIT 1;
    
    -- Get campaign name
    SELECT c.name INTO campaign_name
    FROM public.campaigns c
    WHERE c.id = NEW.campaign_id;
    
    -- Log the donation
    IF donor_record.id IS NOT NULL THEN
      INSERT INTO public.business_activity_log (business_id, activity_type, activity_data)
      VALUES (
        NEW.business_id,
        'donation_received',
        jsonb_build_object(
          'order_id', NEW.id,
          'donor_id', donor_record.id,
          'donor_name', COALESCE(donor_record.first_name || ' ' || donor_record.last_name, donor_record.email),
          'amount', NEW.total_amount,
          'campaign_id', NEW.campaign_id,
          'campaign_name', campaign_name,
          'donated_at', NEW.created_at
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS track_business_engagement_trigger ON public.businesses;
CREATE TRIGGER track_business_engagement_trigger
  AFTER UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.track_business_engagement_changes();

DROP TRIGGER IF EXISTS track_business_donor_links_trigger ON public.business_donors;
CREATE TRIGGER track_business_donor_links_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.business_donors
  FOR EACH ROW
  EXECUTE FUNCTION public.track_business_donor_links();

DROP TRIGGER IF EXISTS log_business_donations_trigger ON public.orders;
CREATE TRIGGER log_business_donations_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_business_donations();