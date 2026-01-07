-- Create business_assets table for centralized asset library
CREATE TABLE public.business_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast lookups by business
CREATE INDEX idx_business_assets_business_id ON public.business_assets(business_id);
CREATE INDEX idx_business_assets_asset_type ON public.business_assets(asset_type);

-- Enable RLS
ALTER TABLE public.business_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view assets for businesses they are linked to
CREATE POLICY "Users can view assets for their linked businesses"
ON public.business_assets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_donors bd
    JOIN public.donor_profiles dp ON bd.donor_id = dp.id
    WHERE bd.business_id = business_assets.business_id
    AND dp.user_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
);

-- Policy: Users can insert assets for businesses they are linked to
CREATE POLICY "Users can insert assets for their linked businesses"
ON public.business_assets
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_donors bd
    JOIN public.donor_profiles dp ON bd.donor_id = dp.id
    WHERE bd.business_id = business_assets.business_id
    AND dp.user_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
);

-- Policy: Users can update assets for businesses they are linked to
CREATE POLICY "Users can update assets for their linked businesses"
ON public.business_assets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.business_donors bd
    JOIN public.donor_profiles dp ON bd.donor_id = dp.id
    WHERE bd.business_id = business_assets.business_id
    AND dp.user_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
);

-- Policy: Users can delete assets for businesses they are linked to
CREATE POLICY "Users can delete assets for their linked businesses"
ON public.business_assets
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.business_donors bd
    JOIN public.donor_profiles dp ON bd.donor_id = dp.id
    WHERE bd.business_id = business_assets.business_id
    AND dp.user_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
);

-- Policy: Organization users can manage assets for their org's businesses
CREATE POLICY "Org users can manage business assets"
ON public.business_assets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_businesses ob
    JOIN public.organization_user ou ON ob.organization_id = ou.organization_id
    WHERE ob.business_id = business_assets.business_id
    AND ou.user_id = auth.uid()
  )
);

-- Add business_asset_id to order_asset_uploads to reference library assets
ALTER TABLE public.order_asset_uploads
ADD COLUMN business_asset_id UUID REFERENCES public.business_assets(id) ON DELETE SET NULL;

-- Create trigger to update updated_at
CREATE TRIGGER update_business_assets_updated_at
BEFORE UPDATE ON public.business_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();