-- Create business_campaign_assets table for per-campaign branding
CREATE TABLE public.business_campaign_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Campaign-specific branding
  campaign_logo_url TEXT,
  additional_files JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  use_default_logo BOOLEAN DEFAULT false,
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  
  -- Ensure one asset record per business/campaign
  CONSTRAINT unique_business_campaign UNIQUE(business_id, campaign_id)
);

-- Enable RLS
ALTER TABLE public.business_campaign_assets ENABLE ROW LEVEL SECURITY;

-- Linked donors can view their business's campaign assets
CREATE POLICY "Donors can view their business campaign assets"
ON public.business_campaign_assets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM business_donors bd
    WHERE bd.business_id = business_campaign_assets.business_id
    AND bd.donor_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
  OR user_belongs_to_organization(auth.uid(), organization_id)
  OR is_system_admin(auth.uid())
);

-- Linked donors can create/update assets for their businesses
CREATE POLICY "Donors can manage their business campaign assets"
ON public.business_campaign_assets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM business_donors bd
    WHERE bd.business_id = business_campaign_assets.business_id
    AND bd.donor_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
  OR user_belongs_to_organization(auth.uid(), organization_id)
  OR is_system_admin(auth.uid())
);

-- Create indexes for performance
CREATE INDEX idx_business_campaign_assets_business ON public.business_campaign_assets(business_id);
CREATE INDEX idx_business_campaign_assets_campaign ON public.business_campaign_assets(campaign_id);
CREATE INDEX idx_business_campaign_assets_org ON public.business_campaign_assets(organization_id);

-- Create storage bucket for campaign assets
INSERT INTO storage.buckets (id, name, public) VALUES ('business-campaign-assets', 'business-campaign-assets', true);

-- Storage policies for business campaign assets
CREATE POLICY "Anyone can view business campaign assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-campaign-assets');

CREATE POLICY "Authenticated users can upload business campaign assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business-campaign-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their business campaign assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'business-campaign-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their business campaign assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'business-campaign-assets' AND auth.role() = 'authenticated');