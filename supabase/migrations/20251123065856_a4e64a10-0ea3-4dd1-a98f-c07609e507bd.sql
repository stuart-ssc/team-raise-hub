-- Create storage bucket for email images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-images',
  'email-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for email images bucket
CREATE POLICY "Authenticated users can upload email images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-images');

CREATE POLICY "Public can view email images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'email-images');

CREATE POLICY "Users can update their own email images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'email-images');

CREATE POLICY "Users can delete their own email images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'email-images');