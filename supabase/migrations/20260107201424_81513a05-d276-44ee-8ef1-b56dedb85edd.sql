-- Update RLS policy on roster_member_campaign_links to allow parents to view their linked children's links
DROP POLICY IF EXISTS "Roster members can view their campaign links" ON roster_member_campaign_links;

CREATE POLICY "Roster members can view their campaign links" ON roster_member_campaign_links
FOR SELECT USING (
  -- User can view their own campaign links (roster_member_id links to organization_user.id)
  (EXISTS (
    SELECT 1 FROM organization_user ou
    WHERE ou.user_id = auth.uid()
    AND ou.id = roster_member_campaign_links.roster_member_id
    AND ou.active_user = true
  ))
  OR
  -- User can view campaign links of their linked children (parent/guardian access)
  (EXISTS (
    SELECT 1 FROM organization_user parent_ou
    WHERE parent_ou.user_id = auth.uid()
    AND parent_ou.active_user = true
    AND parent_ou.linked_organization_user_id = roster_member_campaign_links.roster_member_id
  ))
  OR
  -- System admins can view all
  is_system_admin(auth.uid())
);