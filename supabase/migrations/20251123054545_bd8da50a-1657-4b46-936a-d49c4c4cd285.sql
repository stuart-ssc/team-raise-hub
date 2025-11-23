-- Create storage policies for verification-documents bucket

-- Policy: Organization admins can upload their own verification documents
CREATE POLICY "Org admins can upload verification documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid() 
    AND ut.permission_level = 'organization_admin'
  )
);

-- Policy: Organization admins can view their own verification documents
CREATE POLICY "Org admins can view their verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Organization admins can delete their own verification documents
CREATE POLICY "Org admins can delete their verification documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid() 
    AND ut.permission_level = 'organization_admin'
  )
);

-- Policy: System admins can view all verification documents
CREATE POLICY "System admins can view all verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND is_system_admin(auth.uid())
);