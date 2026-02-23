
CREATE POLICY "Users can view organizations they just created"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND created_at > now() - interval '5 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM organization_user ou 
      WHERE ou.organization_id = organizations.id
    )
  );
