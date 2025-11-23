-- Create donor profiles table with engagement metrics
CREATE TABLE public.donor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  total_donations numeric DEFAULT 0,
  donation_count integer DEFAULT 0,
  first_donation_date timestamp with time zone,
  last_donation_date timestamp with time zone,
  engagement_score integer DEFAULT 0,
  lifetime_value numeric DEFAULT 0,
  notes text,
  tags text[],
  preferred_communication text DEFAULT 'email',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(email, organization_id)
);

-- Enable RLS on donor_profiles
ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;

-- Organization members can view donors in their org
CREATE POLICY "Organization members can view donors"
  ON public.donor_profiles
  FOR SELECT
  USING (
    user_belongs_to_organization(auth.uid(), organization_id) 
    OR is_system_admin(auth.uid())
  );

-- Organization admins and program managers can create donors
CREATE POLICY "Authorized users can create donors"
  ON public.donor_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = donor_profiles.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
    OR is_system_admin(auth.uid())
  );

-- Organization admins and program managers can update donors
CREATE POLICY "Authorized users can update donors"
  ON public.donor_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = donor_profiles.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
    OR is_system_admin(auth.uid())
  );

-- Create thank you message templates table
CREATE TABLE public.thank_you_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on thank_you_templates
ALTER TABLE public.thank_you_templates ENABLE ROW LEVEL SECURITY;

-- Organization members can view templates
CREATE POLICY "Organization members can view templates"
  ON public.thank_you_templates
  FOR SELECT
  USING (
    user_belongs_to_organization(auth.uid(), organization_id)
    OR is_system_admin(auth.uid())
  );

-- Organization admins and program managers can manage templates
CREATE POLICY "Authorized users can manage templates"
  ON public.thank_you_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = thank_you_templates.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
    OR is_system_admin(auth.uid())
  );

-- Create donor activity log table
CREATE TABLE public.donor_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on donor_activity_log
ALTER TABLE public.donor_activity_log ENABLE ROW LEVEL SECURITY;

-- Organization members can view activity logs
CREATE POLICY "Organization members can view activity logs"
  ON public.donor_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM donor_profiles dp
      WHERE dp.id = donor_activity_log.donor_id
      AND user_belongs_to_organization(auth.uid(), dp.organization_id)
    )
    OR is_system_admin(auth.uid())
  );

-- Function to update donor profile from orders
CREATE OR REPLACE FUNCTION update_donor_profile_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
  donor_id uuid;
  total_amount numeric;
  donation_cnt integer;
  engagement int;
BEGIN
  -- Only process successful orders with customer email
  IF NEW.status NOT IN ('succeeded', 'completed') OR NEW.customer_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get organization_id from campaign
  SELECT g.organization_id INTO org_id
  FROM campaigns c
  JOIN groups g ON c.group_id = g.id
  WHERE c.id = NEW.campaign_id;

  IF org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Upsert donor profile
  INSERT INTO donor_profiles (
    email,
    first_name,
    last_name,
    organization_id,
    total_donations,
    donation_count,
    first_donation_date,
    last_donation_date,
    lifetime_value
  )
  VALUES (
    NEW.customer_email,
    split_part(NEW.customer_name, ' ', 1),
    split_part(NEW.customer_name, ' ', 2),
    org_id,
    NEW.total_amount,
    1,
    NEW.created_at,
    NEW.created_at,
    NEW.total_amount
  )
  ON CONFLICT (email, organization_id) 
  DO UPDATE SET
    total_donations = donor_profiles.total_donations + NEW.total_amount,
    donation_count = donor_profiles.donation_count + 1,
    last_donation_date = NEW.created_at,
    lifetime_value = donor_profiles.lifetime_value + NEW.total_amount,
    updated_at = now()
  RETURNING id INTO donor_id;

  -- Calculate engagement score (0-100)
  -- Factors: recency (40%), frequency (30%), monetary value (30%)
  SELECT 
    LEAST(100, GREATEST(0,
      -- Recency: days since last donation (40 points max)
      (40 - LEAST(40, EXTRACT(DAY FROM (now() - dp.last_donation_date)))) +
      -- Frequency: number of donations (30 points max, 1 point per donation, max 30)
      LEAST(30, dp.donation_count) +
      -- Monetary: lifetime value (30 points max, 1 point per $100, max 30)
      LEAST(30, FLOOR(dp.lifetime_value / 10000))
    )) INTO engagement
  FROM donor_profiles dp
  WHERE dp.id = donor_id;

  -- Update engagement score
  UPDATE donor_profiles
  SET engagement_score = engagement
  WHERE id = donor_id;

  -- Log the donation activity
  INSERT INTO donor_activity_log (donor_id, activity_type, activity_data)
  VALUES (
    donor_id,
    'donation',
    jsonb_build_object(
      'order_id', NEW.id,
      'amount', NEW.total_amount,
      'campaign_id', NEW.campaign_id
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger to update donor profiles
DROP TRIGGER IF EXISTS trigger_update_donor_profile ON orders;
CREATE TRIGGER trigger_update_donor_profile
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_donor_profile_from_order();

-- Create updated_at trigger for donor_profiles
CREATE TRIGGER update_donor_profiles_updated_at
  BEFORE UPDATE ON donor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for thank_you_templates
CREATE TRIGGER update_thank_you_templates_updated_at
  BEFORE UPDATE ON thank_you_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();