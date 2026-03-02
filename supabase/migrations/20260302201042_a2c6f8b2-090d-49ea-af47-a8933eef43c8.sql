-- Users should always be able to see their own organization_user records
CREATE POLICY "Users can view their own organization_user records"
  ON organization_user
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);