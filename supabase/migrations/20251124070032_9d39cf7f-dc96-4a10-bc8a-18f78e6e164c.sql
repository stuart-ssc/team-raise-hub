-- Create business_nurture_campaigns table
CREATE TABLE public.business_nurture_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('health_check', 'expansion', 'at_risk', 're_engagement')),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create business_nurture_sequences table
CREATE TABLE public.business_nurture_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.business_nurture_campaigns(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  email_template_key TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  email_body TEXT NOT NULL,
  send_delay_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, sequence_order)
);

-- Create business_nurture_enrollments table
CREATE TABLE public.business_nurture_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.business_nurture_campaigns(id) ON DELETE CASCADE,
  queue_item_id UUID REFERENCES public.business_outreach_queue(id) ON DELETE SET NULL,
  current_sequence_id UUID REFERENCES public.business_nurture_sequences(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_send_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_id, campaign_id)
);

-- Enable RLS
ALTER TABLE public.business_nurture_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_nurture_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_nurture_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_nurture_campaigns
CREATE POLICY "Organization members can view campaigns"
  ON public.business_nurture_campaigns FOR SELECT
  USING (user_belongs_to_organization(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

CREATE POLICY "Authorized users can manage campaigns"
  ON public.business_nurture_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = business_nurture_campaigns.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    ) OR is_system_admin(auth.uid())
  );

-- RLS Policies for business_nurture_sequences
CREATE POLICY "Organization members can view sequences"
  ON public.business_nurture_sequences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_nurture_campaigns c
      WHERE c.id = business_nurture_sequences.campaign_id
      AND (user_belongs_to_organization(auth.uid(), c.organization_id) OR is_system_admin(auth.uid()))
    )
  );

CREATE POLICY "Authorized users can manage sequences"
  ON public.business_nurture_sequences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_nurture_campaigns c
      JOIN organization_user ou ON c.organization_id = ou.organization_id
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE c.id = business_nurture_sequences.campaign_id
      AND ou.user_id = auth.uid()
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    ) OR is_system_admin(auth.uid())
  );

-- RLS Policies for business_nurture_enrollments
CREATE POLICY "Organization members can view enrollments"
  ON public.business_nurture_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_nurture_campaigns c
      WHERE c.id = business_nurture_enrollments.campaign_id
      AND (user_belongs_to_organization(auth.uid(), c.organization_id) OR is_system_admin(auth.uid()))
    )
  );

CREATE POLICY "Authorized users can manage enrollments"
  ON public.business_nurture_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_nurture_campaigns c
      JOIN organization_user ou ON c.organization_id = ou.organization_id
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE c.id = business_nurture_enrollments.campaign_id
      AND ou.user_id = auth.uid()
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    ) OR is_system_admin(auth.uid())
  );

-- Create indexes for performance
CREATE INDEX idx_business_nurture_campaigns_org ON public.business_nurture_campaigns(organization_id);
CREATE INDEX idx_business_nurture_campaigns_status ON public.business_nurture_campaigns(status);
CREATE INDEX idx_business_nurture_sequences_campaign ON public.business_nurture_sequences(campaign_id);
CREATE INDEX idx_business_nurture_enrollments_business ON public.business_nurture_enrollments(business_id);
CREATE INDEX idx_business_nurture_enrollments_campaign ON public.business_nurture_enrollments(campaign_id);
CREATE INDEX idx_business_nurture_enrollments_status ON public.business_nurture_enrollments(status);
CREATE INDEX idx_business_nurture_enrollments_next_send ON public.business_nurture_enrollments(next_send_at) WHERE status = 'active';

-- Create triggers for updated_at
CREATE TRIGGER update_business_nurture_campaigns_updated_at
  BEFORE UPDATE ON public.business_nurture_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_nurture_sequences_updated_at
  BEFORE UPDATE ON public.business_nurture_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_nurture_enrollments_updated_at
  BEFORE UPDATE ON public.business_nurture_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();