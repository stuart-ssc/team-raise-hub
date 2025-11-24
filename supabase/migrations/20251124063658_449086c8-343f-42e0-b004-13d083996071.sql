-- Create business_outreach_queue table
CREATE TABLE IF NOT EXISTS public.business_outreach_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  priority_score INTEGER NOT NULL DEFAULT 0 CHECK (priority_score >= 0 AND priority_score <= 100),
  partnership_health_status TEXT NOT NULL DEFAULT 'good' CHECK (partnership_health_status IN ('excellent', 'good', 'needs_attention', 'at_risk', 'critical')),
  expansion_potential_level TEXT NOT NULL DEFAULT 'medium' CHECK (expansion_potential_level IN ('high', 'medium', 'low')),
  recommended_outreach_date DATE NOT NULL,
  recommended_outreach_target TEXT NOT NULL CHECK (recommended_outreach_target IN ('business_entity', 'primary_contact', 'specific_contact')),
  specific_contact_id UUID REFERENCES public.donor_profiles(id) ON DELETE SET NULL,
  queue_insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actioned_at TIMESTAMP WITH TIME ZONE,
  actioned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_outreach_org_priority ON public.business_outreach_queue(organization_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_business_outreach_date ON public.business_outreach_queue(recommended_outreach_date);
CREATE INDEX IF NOT EXISTS idx_business_outreach_status ON public.business_outreach_queue(partnership_health_status);

-- Enable RLS
ALTER TABLE public.business_outreach_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organization members can view queue items"
  ON public.business_outreach_queue
  FOR SELECT
  USING (
    user_belongs_to_organization(auth.uid(), organization_id) 
    OR is_system_admin(auth.uid())
  );

CREATE POLICY "Authorized users can manage queue items"
  ON public.business_outreach_queue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = business_outreach_queue.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
    OR is_system_admin(auth.uid())
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_business_outreach_queue_updated_at
  BEFORE UPDATE ON public.business_outreach_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();