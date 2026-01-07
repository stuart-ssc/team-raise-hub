-- Add UPDATE policy for businesses table (for organization admins)
CREATE POLICY "Organization admins can update businesses" 
ON businesses FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_businesses ob
    JOIN organization_user ou ON ou.organization_id = ob.organization_id
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ob.business_id = businesses.id 
    AND ou.user_id = auth.uid() 
    AND ou.active_user = true
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR is_system_admin(auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_businesses ob
    JOIN organization_user ou ON ou.organization_id = ob.organization_id
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ob.business_id = businesses.id 
    AND ou.user_id = auth.uid() 
    AND ou.active_user = true
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR is_system_admin(auth.uid())
);

-- Add INSERT policy for business_activity_log table (for organization members)
CREATE POLICY "Organization members can insert activity logs" 
ON business_activity_log FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_businesses ob
    JOIN organization_user ou ON ou.organization_id = ob.organization_id
    WHERE ob.business_id = business_activity_log.business_id 
    AND ou.user_id = auth.uid() 
    AND ou.active_user = true
  )
  OR is_system_admin(auth.uid())
);