-- Drop the existing overly-restrictive policies
DROP POLICY IF EXISTS "Users with qualifying roles can upload campaign item images" ON storage.objects;
DROP POLICY IF EXISTS "Users with qualifying roles can update campaign item images" ON storage.objects;
DROP POLICY IF EXISTS "Users with qualifying roles can delete campaign item images" ON storage.objects;

-- Create a new INSERT policy that includes both school_user and organization_user
CREATE POLICY "Users with qualifying roles can upload campaign item images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'campaign-item-images' 
  AND (
    -- Original school_user check
    EXISTS (
      SELECT 1 FROM school_user su
      JOIN user_type ut ON (su.user_type_id = ut.id)
      WHERE su.user_id = auth.uid() 
      AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
    )
    OR
    -- NEW: organization_user check for org admins and program managers
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON (ou.user_type_id = ut.id)
      WHERE ou.user_id = auth.uid() 
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
  )
);

-- Create a new UPDATE policy
CREATE POLICY "Users with qualifying roles can update campaign item images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'campaign-item-images' 
  AND (
    EXISTS (
      SELECT 1 FROM school_user su
      JOIN user_type ut ON (su.user_type_id = ut.id)
      WHERE su.user_id = auth.uid() 
      AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
    )
    OR
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON (ou.user_type_id = ut.id)
      WHERE ou.user_id = auth.uid() 
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
  )
);

-- Create a new DELETE policy
CREATE POLICY "Users with qualifying roles can delete campaign item images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'campaign-item-images' 
  AND (
    EXISTS (
      SELECT 1 FROM school_user su
      JOIN user_type ut ON (su.user_type_id = ut.id)
      WHERE su.user_id = auth.uid() 
      AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
    )
    OR
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON (ou.user_type_id = ut.id)
      WHERE ou.user_id = auth.uid() 
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
  )
);