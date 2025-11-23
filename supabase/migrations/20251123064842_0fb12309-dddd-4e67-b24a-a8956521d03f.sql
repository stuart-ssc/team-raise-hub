-- Create nurture campaigns table
CREATE TABLE IF NOT EXISTS public.nurture_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('welcome', 'reengagement', 'milestone', 'custom')),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create nurture sequences table (emails in a campaign)
CREATE TABLE IF NOT EXISTS public.nurture_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.nurture_campaigns(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  subject_line TEXT NOT NULL,
  email_content TEXT NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, sequence_order)
);

-- Create campaign enrollments table (tracks which donors are in which campaigns)
CREATE TABLE IF NOT EXISTS public.nurture_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.nurture_campaigns(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
  current_sequence INTEGER DEFAULT 1,
  next_send_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'unsubscribed')),
  UNIQUE(campaign_id, donor_id)
);

-- Create index for efficient querying
CREATE INDEX idx_nurture_enrollments_next_send ON public.nurture_enrollments(next_send_at) WHERE status = 'active';
CREATE INDEX idx_nurture_campaigns_org ON public.nurture_campaigns(organization_id);
CREATE INDEX idx_donor_profiles_rfm_segment ON public.donor_profiles(rfm_segment);
CREATE INDEX idx_donor_profiles_last_donation ON public.donor_profiles(last_donation_date);

-- Enable RLS
ALTER TABLE public.nurture_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurture_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurture_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nurture_campaigns
CREATE POLICY "Organization members can view campaigns"
  ON public.nurture_campaigns FOR SELECT
  USING (user_belongs_to_organization(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

CREATE POLICY "Authorized users can manage campaigns"
  ON public.nurture_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
        AND ou.organization_id = nurture_campaigns.organization_id
        AND ut.permission_level IN ('organization_admin', 'program_manager')
    ) OR is_system_admin(auth.uid())
  );

-- RLS Policies for nurture_sequences
CREATE POLICY "Organization members can view sequences"
  ON public.nurture_sequences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nurture_campaigns nc
      WHERE nc.id = nurture_sequences.campaign_id
        AND (user_belongs_to_organization(auth.uid(), nc.organization_id) OR is_system_admin(auth.uid()))
    )
  );

CREATE POLICY "Authorized users can manage sequences"
  ON public.nurture_sequences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nurture_campaigns nc
      JOIN organization_user ou ON nc.organization_id = ou.organization_id
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE nc.id = nurture_sequences.campaign_id
        AND ou.user_id = auth.uid()
        AND ut.permission_level IN ('organization_admin', 'program_manager')
    ) OR is_system_admin(auth.uid())
  );

-- RLS Policies for nurture_enrollments
CREATE POLICY "Organization members can view enrollments"
  ON public.nurture_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nurture_campaigns nc
      WHERE nc.id = nurture_enrollments.campaign_id
        AND (user_belongs_to_organization(auth.uid(), nc.organization_id) OR is_system_admin(auth.uid()))
    )
  );

CREATE POLICY "System can manage enrollments"
  ON public.nurture_enrollments FOR ALL
  USING (is_system_admin(auth.uid()));

-- Trigger to update updated_at
CREATE TRIGGER update_nurture_campaigns_updated_at
  BEFORE UPDATE ON public.nurture_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nurture_sequences_updated_at
  BEFORE UPDATE ON public.nurture_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();