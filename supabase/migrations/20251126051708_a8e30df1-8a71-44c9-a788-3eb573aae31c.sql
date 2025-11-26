-- Drop outdated RLS policy that references school_user
DROP POLICY IF EXISTS "Users can view profiles of users in their school" ON profiles;

-- Create new RLS policy using organization_user table
CREATE POLICY "Users can view profiles of users in their organization"
ON profiles FOR SELECT
USING (
  auth.uid() = id  -- Can always view own profile
  OR
  EXISTS (
    SELECT 1 
    FROM organization_user ou1
    JOIN organization_user ou2 ON ou1.organization_id = ou2.organization_id
    WHERE ou1.user_id = auth.uid() 
      AND ou2.user_id = profiles.id
      AND ou1.active_user = true
  )
  OR
  is_system_admin(auth.uid())  -- System admins can view all profiles
);