-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their assigned roster" ON rosters;

-- Create updated policy with parent access
CREATE POLICY "Users can view their assigned roster" ON rosters
FOR SELECT USING (
  -- User can view their own assigned roster
  (EXISTS (
    SELECT 1 FROM organization_user ou
    WHERE ou.user_id = auth.uid()
    AND ou.roster_id = rosters.id
    AND ou.active_user = true
  ))
  OR
  -- Parent/guardian can view rosters of their linked children
  (EXISTS (
    SELECT 1 FROM organization_user parent_ou
    JOIN organization_user child_ou ON child_ou.id = parent_ou.linked_organization_user_id
    WHERE parent_ou.user_id = auth.uid()
    AND parent_ou.active_user = true
    AND child_ou.roster_id = rosters.id
    AND child_ou.active_user = true
  ))
  OR
  is_system_admin(auth.uid())
);