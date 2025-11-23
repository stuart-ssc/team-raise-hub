-- Create donor_insights table for storing AI-generated insights
CREATE TABLE IF NOT EXISTS public.donor_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority_score INTEGER NOT NULL DEFAULT 0,
  optimal_contact_date DATE,
  retention_risk_level TEXT,
  suggested_ask_amount NUMERIC,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(donor_id)
);

-- Create index for faster queries
CREATE INDEX idx_donor_insights_organization_id ON public.donor_insights(organization_id);
CREATE INDEX idx_donor_insights_priority_score ON public.donor_insights(priority_score DESC);
CREATE INDEX idx_donor_insights_optimal_contact_date ON public.donor_insights(optimal_contact_date);
CREATE INDEX idx_donor_insights_retention_risk ON public.donor_insights(retention_risk_level);

-- Enable RLS
ALTER TABLE public.donor_insights ENABLE ROW LEVEL SECURITY;

-- Organization members can view insights
CREATE POLICY "Organization members can view insights"
ON public.donor_insights
FOR SELECT
USING (
  user_belongs_to_organization(auth.uid(), organization_id) 
  OR is_system_admin(auth.uid())
);

-- System can manage insights
CREATE POLICY "System can manage insights"
ON public.donor_insights
FOR ALL
USING (is_system_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_donor_insights_updated_at
  BEFORE UPDATE ON public.donor_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();