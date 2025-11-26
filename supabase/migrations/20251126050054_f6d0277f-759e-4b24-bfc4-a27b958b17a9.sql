-- Drop existing outdated RLS policies on rosters table
DROP POLICY IF EXISTS "Users with qualifying roles can create rosters at their school" ON rosters;
DROP POLICY IF EXISTS "Users with qualifying roles can delete rosters at their school" ON rosters;
DROP POLICY IF EXISTS "Users with qualifying roles can update rosters at their school" ON rosters;
DROP POLICY IF EXISTS "Users with qualifying roles can view rosters at their school" ON rosters;

-- Create new RLS policies using organization_user
CREATE POLICY "Organization users can view rosters"
ON rosters FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN groups g ON rosters.group_id = g.id
    WHERE ou.user_id = auth.uid() 
      AND ou.organization_id = g.organization_id
      AND ou.active_user = true
      AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader', 'Executive Director', 'Program Director')
  )
);

CREATE POLICY "Organization users can create rosters"
ON rosters FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN groups g ON rosters.group_id = g.id
    WHERE ou.user_id = auth.uid() 
      AND ou.organization_id = g.organization_id
      AND ou.active_user = true
      AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader', 'Executive Director', 'Program Director')
  )
);

CREATE POLICY "Organization users can update rosters"
ON rosters FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN groups g ON rosters.group_id = g.id
    WHERE ou.user_id = auth.uid() 
      AND ou.organization_id = g.organization_id
      AND ou.active_user = true
      AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader', 'Executive Director', 'Program Director')
  )
);

CREATE POLICY "Organization users can delete rosters"
ON rosters FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN groups g ON rosters.group_id = g.id
    WHERE ou.user_id = auth.uid() 
      AND ou.organization_id = g.organization_id
      AND ou.active_user = true
      AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader', 'Executive Director', 'Program Director')
  )
);