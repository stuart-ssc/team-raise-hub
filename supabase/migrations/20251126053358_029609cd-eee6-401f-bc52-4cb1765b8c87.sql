-- Drop the existing generic INSERT policy
DROP POLICY IF EXISTS "System can create businesses" ON businesses;

-- Create a proper INSERT policy that checks user authorization
CREATE POLICY "Authorized users can create businesses"
ON businesses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid() 
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR is_system_admin(auth.uid())
);

-- Drop and recreate the SELECT policy to allow org admins/program managers to view businesses
DROP POLICY IF EXISTS "Users can view businesses in their organization" ON businesses;

CREATE POLICY "Users can view businesses"
ON businesses FOR SELECT
USING (
  -- Existing relationship-based access
  user_can_view_business(auth.uid(), id)
  OR
  -- Organization admins and program managers can view any business for management
  EXISTS (
    SELECT 1 
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid() 
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR is_system_admin(auth.uid())
);