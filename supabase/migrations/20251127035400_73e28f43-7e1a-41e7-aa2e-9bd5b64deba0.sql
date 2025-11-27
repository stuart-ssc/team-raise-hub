-- Add linked_organization_user_id column to organization_user table
-- This allows family members to be linked to specific players/students
ALTER TABLE organization_user 
ADD COLUMN linked_organization_user_id uuid REFERENCES organization_user(id);

COMMENT ON COLUMN organization_user.linked_organization_user_id IS 'Links family members to their associated player/student for donation attribution';