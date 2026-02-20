CREATE POLICY "Authenticated users can upload verification documents to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);