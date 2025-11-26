-- Create organization-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for organization-logos bucket
CREATE POLICY "Organization logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-logos');

CREATE POLICY "Organization admins can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'organization-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM organization_user 
    WHERE active_user = true
  )
);

CREATE POLICY "Organization admins can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'organization-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM organization_user 
    WHERE active_user = true
  )
);

CREATE POLICY "Organization admins can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'organization-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM organization_user 
    WHERE active_user = true
  )
);