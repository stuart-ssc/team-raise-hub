-- Function to log donor profile updates
CREATE OR REPLACE FUNCTION public.log_donor_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_fields jsonb := '{}'::jsonb;
BEGIN
  -- Track which fields changed
  IF OLD.first_name IS DISTINCT FROM NEW.first_name THEN
    changed_fields := changed_fields || jsonb_build_object('first_name', jsonb_build_object('old', OLD.first_name, 'new', NEW.first_name));
  END IF;
  
  IF OLD.last_name IS DISTINCT FROM NEW.last_name THEN
    changed_fields := changed_fields || jsonb_build_object('last_name', jsonb_build_object('old', OLD.last_name, 'new', NEW.last_name));
  END IF;
  
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    changed_fields := changed_fields || jsonb_build_object('email', jsonb_build_object('old', OLD.email, 'new', NEW.email));
  END IF;
  
  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    changed_fields := changed_fields || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone));
  END IF;
  
  IF OLD.tags IS DISTINCT FROM NEW.tags THEN
    changed_fields := changed_fields || jsonb_build_object('tags', jsonb_build_object('old', OLD.tags, 'new', NEW.tags));
  END IF;
  
  IF OLD.preferred_communication IS DISTINCT FROM NEW.preferred_communication THEN
    changed_fields := changed_fields || jsonb_build_object('preferred_communication', jsonb_build_object('old', OLD.preferred_communication, 'new', NEW.preferred_communication));
  END IF;
  
  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    changed_fields := changed_fields || jsonb_build_object('notes_updated', true);
  END IF;
  
  -- Only log if something meaningful changed (exclude automatic updates like updated_at, engagement_score changes from donations, etc.)
  IF jsonb_object_keys(changed_fields) IS NOT NULL THEN
    INSERT INTO public.donor_activity_log (donor_id, activity_type, activity_data)
    VALUES (
      NEW.id,
      'profile_update',
      jsonb_build_object(
        'changed_fields', changed_fields,
        'updated_at', NEW.updated_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to log donor segment changes
CREATE OR REPLACE FUNCTION public.log_donor_segment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if segment actually changed
  IF OLD.rfm_segment IS DISTINCT FROM NEW.rfm_segment THEN
    INSERT INTO public.donor_activity_log (donor_id, activity_type, activity_data)
    VALUES (
      NEW.id,
      'segment_change',
      jsonb_build_object(
        'old_segment', OLD.rfm_segment,
        'new_segment', NEW.rfm_segment,
        'recency_score', NEW.rfm_recency_score,
        'frequency_score', NEW.rfm_frequency_score,
        'monetary_score', NEW.rfm_monetary_score,
        'changed_at', NEW.segment_updated_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to log email engagement (opens and clicks)
CREATE OR REPLACE FUNCTION public.log_email_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donor_record RECORD;
BEGIN
  -- Find the donor by email
  SELECT id INTO donor_record
  FROM public.donor_profiles
  WHERE email = NEW.recipient_email
  LIMIT 1;
  
  -- If donor exists, log the engagement
  IF donor_record.id IS NOT NULL THEN
    -- Log email opened
    IF OLD.opened_at IS NULL AND NEW.opened_at IS NOT NULL THEN
      INSERT INTO public.donor_activity_log (donor_id, activity_type, activity_data)
      VALUES (
        donor_record.id,
        'email_opened',
        jsonb_build_object(
          'email_id', NEW.id,
          'email_type', NEW.email_type,
          'subject', COALESCE(NEW.metadata->>'subject', 'No subject'),
          'opened_at', NEW.opened_at,
          'sent_at', NEW.sent_at
        )
      );
    END IF;
    
    -- Log email clicked
    IF OLD.clicked_at IS NULL AND NEW.clicked_at IS NOT NULL THEN
      INSERT INTO public.donor_activity_log (donor_id, activity_type, activity_data)
      VALUES (
        donor_record.id,
        'email_clicked',
        jsonb_build_object(
          'email_id', NEW.id,
          'email_type', NEW.email_type,
          'subject', COALESCE(NEW.metadata->>'subject', 'No subject'),
          'clicked_at', NEW.clicked_at,
          'opened_at', NEW.opened_at,
          'sent_at', NEW.sent_at
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to log email sent events
CREATE OR REPLACE FUNCTION public.log_email_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donor_record RECORD;
BEGIN
  -- Find the donor by email
  SELECT id INTO donor_record
  FROM public.donor_profiles
  WHERE email = NEW.recipient_email
  LIMIT 1;
  
  -- If donor exists and email was just sent, log it
  IF donor_record.id IS NOT NULL AND NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL THEN
    INSERT INTO public.donor_activity_log (donor_id, activity_type, activity_data)
    VALUES (
      donor_record.id,
      'email_sent',
      jsonb_build_object(
        'email_id', NEW.id,
        'email_type', NEW.email_type,
        'subject', COALESCE(NEW.metadata->>'subject', 'No subject'),
        'sent_at', NEW.sent_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile updates (excluding automatic system updates)
DROP TRIGGER IF EXISTS trigger_log_donor_profile_update ON public.donor_profiles;
CREATE TRIGGER trigger_log_donor_profile_update
  AFTER UPDATE ON public.donor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_donor_profile_update();

-- Create trigger for segment changes
DROP TRIGGER IF EXISTS trigger_log_donor_segment_change ON public.donor_profiles;
CREATE TRIGGER trigger_log_donor_segment_change
  AFTER UPDATE ON public.donor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_donor_segment_change();

-- Create trigger for email engagement
DROP TRIGGER IF EXISTS trigger_log_email_engagement ON public.email_delivery_log;
CREATE TRIGGER trigger_log_email_engagement
  AFTER UPDATE ON public.email_delivery_log
  FOR EACH ROW
  EXECUTE FUNCTION public.log_email_engagement();

-- Create trigger for email sent
DROP TRIGGER IF EXISTS trigger_log_email_sent ON public.email_delivery_log;
CREATE TRIGGER trigger_log_email_sent
  AFTER UPDATE ON public.email_delivery_log
  FOR EACH ROW
  EXECUTE FUNCTION public.log_email_sent();

-- Create campaign_views table for tracking when donors view campaign pages
CREATE TABLE IF NOT EXISTS public.campaign_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  donor_email text NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  referrer text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for campaign views lookup
CREATE INDEX IF NOT EXISTS idx_campaign_views_email ON public.campaign_views(donor_email);
CREATE INDEX IF NOT EXISTS idx_campaign_views_campaign ON public.campaign_views(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_views_date ON public.campaign_views(viewed_at);

-- Enable RLS on campaign_views
ALTER TABLE public.campaign_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert campaign views (for tracking anonymous/guest views)
CREATE POLICY "Anyone can log campaign views" ON public.campaign_views
  FOR INSERT
  WITH CHECK (true);

-- Policy: Organization members can view campaign views for their campaigns
CREATE POLICY "Organization members can view their campaign views" ON public.campaign_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.campaigns c
      JOIN public.groups g ON c.group_id = g.id
      WHERE c.id = campaign_views.campaign_id
      AND user_belongs_to_organization(auth.uid(), g.organization_id)
    )
  );

-- Function to log campaign views to donor activity
CREATE OR REPLACE FUNCTION public.log_campaign_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  donor_record RECORD;
  campaign_name text;
BEGIN
  -- Find the donor by email
  SELECT id INTO donor_record
  FROM public.donor_profiles
  WHERE email = NEW.donor_email
  LIMIT 1;
  
  -- Get campaign name
  SELECT name INTO campaign_name
  FROM public.campaigns
  WHERE id = NEW.campaign_id;
  
  -- If donor exists, log the view
  IF donor_record.id IS NOT NULL THEN
    INSERT INTO public.donor_activity_log (donor_id, activity_type, activity_data)
    VALUES (
      donor_record.id,
      'campaign_view',
      jsonb_build_object(
        'campaign_id', NEW.campaign_id,
        'campaign_name', campaign_name,
        'viewed_at', NEW.viewed_at,
        'referrer', NEW.referrer
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for campaign views
DROP TRIGGER IF EXISTS trigger_log_campaign_view ON public.campaign_views;
CREATE TRIGGER trigger_log_campaign_view
  AFTER INSERT ON public.campaign_views
  FOR EACH ROW
  EXECUTE FUNCTION public.log_campaign_view();