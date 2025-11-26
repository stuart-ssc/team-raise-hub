-- Drop outdated RLS policies that reference school_user
DROP POLICY IF EXISTS "Users with qualifying roles can create campaign items at their" ON campaign_items;
DROP POLICY IF EXISTS "Users with qualifying roles can update campaign items at their" ON campaign_items;
DROP POLICY IF EXISTS "Users with qualifying roles can delete campaign items at their" ON campaign_items;
DROP POLICY IF EXISTS "Users with qualifying roles can view campaign items at their sc" ON campaign_items;

-- Create new INSERT policy using organization_user
CREATE POLICY "Authorized users can create campaign items"
ON campaign_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN campaigns c ON campaign_items.campaign_id = c.id
    JOIN groups g ON c.group_id = g.id
    WHERE ou.user_id = auth.uid() 
      AND ou.organization_id = g.organization_id
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR is_system_admin(auth.uid())
);

-- Create new UPDATE policy using organization_user
CREATE POLICY "Authorized users can update campaign items"
ON campaign_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN campaigns c ON campaign_items.campaign_id = c.id
    JOIN groups g ON c.group_id = g.id
    WHERE ou.user_id = auth.uid() 
      AND ou.organization_id = g.organization_id
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR is_system_admin(auth.uid())
);

-- Create new DELETE policy using organization_user
CREATE POLICY "Authorized users can delete campaign items"
ON campaign_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN campaigns c ON campaign_items.campaign_id = c.id
    JOIN groups g ON c.group_id = g.id
    WHERE ou.user_id = auth.uid() 
      AND ou.organization_id = g.organization_id
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR is_system_admin(auth.uid())
);

-- Create new SELECT policy for authorized users using organization_user
CREATE POLICY "Authorized users can view campaign items"
ON campaign_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM organization_user ou
    JOIN campaigns c ON campaign_items.campaign_id = c.id
    JOIN groups g ON c.group_id = g.id
    WHERE ou.user_id = auth.uid() 
      AND ou.organization_id = g.organization_id
      AND ou.active_user = true
  )
  OR is_system_admin(auth.uid())
);