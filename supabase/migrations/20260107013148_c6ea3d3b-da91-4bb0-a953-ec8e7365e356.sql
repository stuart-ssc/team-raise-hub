-- Create storage bucket for business assets library
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for business-assets bucket
CREATE POLICY "Users can view business assets they have access to"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'business-assets' 
  AND (
    EXISTS (
      SELECT 1 FROM public.business_donors bd
      JOIN public.donor_profiles dp ON bd.donor_id = dp.id
      WHERE bd.business_id::text = (storage.foldername(name))[1]
      AND dp.user_id = auth.uid()
      AND bd.blocked_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.organization_businesses ob
      JOIN public.organization_user ou ON ob.organization_id = ou.organization_id
      WHERE ob.business_id::text = (storage.foldername(name))[1]
      AND ou.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can upload business assets for their linked businesses"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-assets'
  AND EXISTS (
    SELECT 1 FROM public.business_donors bd
    JOIN public.donor_profiles dp ON bd.donor_id = dp.id
    WHERE bd.business_id::text = (storage.foldername(name))[1]
    AND dp.user_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
);

CREATE POLICY "Users can update their business assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-assets'
  AND EXISTS (
    SELECT 1 FROM public.business_donors bd
    JOIN public.donor_profiles dp ON bd.donor_id = dp.id
    WHERE bd.business_id::text = (storage.foldername(name))[1]
    AND dp.user_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
);

CREATE POLICY "Users can delete their business assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-assets'
  AND EXISTS (
    SELECT 1 FROM public.business_donors bd
    JOIN public.donor_profiles dp ON bd.donor_id = dp.id
    WHERE bd.business_id::text = (storage.foldername(name))[1]
    AND dp.user_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
);