-- Storage RLS Policies for sponsorship-files bucket (fixed ambiguous column reference)
CREATE POLICY "Donors can upload their sponsorship files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sponsorship-files' AND
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id::text = (storage.foldername(storage.objects.name))[1]
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Donors can view their sponsorship files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'sponsorship-files' AND
  (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id::text = (storage.foldername(storage.objects.name))[1]
      AND orders.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM orders o
      JOIN campaigns c ON o.campaign_id = c.id
      JOIN groups g ON c.group_id = g.id
      JOIN organization_user ou ON g.organization_id = ou.organization_id
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE o.id::text = (storage.foldername(storage.objects.name))[1]
      AND ou.user_id = auth.uid()
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
  )
);

CREATE POLICY "Donors can update their sponsorship files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'sponsorship-files' AND
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id::text = (storage.foldername(storage.objects.name))[1]
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Donors can delete their sponsorship files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'sponsorship-files' AND
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id::text = (storage.foldername(storage.objects.name))[1]
    AND orders.user_id = auth.uid()
  )
);