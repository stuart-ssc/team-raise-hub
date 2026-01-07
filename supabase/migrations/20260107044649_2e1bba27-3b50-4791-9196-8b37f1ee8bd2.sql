-- Create order export history table for audit logging
CREATE TABLE public.order_export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  campaign_ids UUID[],
  export_format TEXT NOT NULL CHECK (export_format IN ('csv', 'xlsx')),
  columns TEXT[] NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  order_count INTEGER NOT NULL,
  filename TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_export_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view exports for their organization
CREATE POLICY "Users can view org export history"
  ON public.order_export_history FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_user WHERE user_id = auth.uid()
  ));

-- Policy: Users can insert exports for their organization
CREATE POLICY "Users can insert export history"
  ON public.order_export_history FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM public.organization_user WHERE user_id = auth.uid()
    )
  );

-- Add index for faster lookups
CREATE INDEX idx_order_export_history_org ON public.order_export_history(organization_id);
CREATE INDEX idx_order_export_history_created ON public.order_export_history(created_at DESC);