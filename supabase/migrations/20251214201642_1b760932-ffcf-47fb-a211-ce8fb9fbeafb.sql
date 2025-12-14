-- Add policy: Users can view their assigned roster (via organization_user.roster_id)
CREATE POLICY "Users can view their assigned roster"
ON rosters FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_user ou
    WHERE ou.user_id = auth.uid()
    AND ou.roster_id = rosters.id
    AND ou.active_user = true
  )
  OR is_system_admin(auth.uid())
);