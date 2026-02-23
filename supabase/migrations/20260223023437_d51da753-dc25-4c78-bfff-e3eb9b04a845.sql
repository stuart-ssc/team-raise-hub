-- Drop the existing constraint
ALTER TABLE organization_user DROP CONSTRAINT IF EXISTS organization_user_user_id_organization_id_group_id_key;

-- Add a new constraint that includes user_type_id
ALTER TABLE organization_user ADD CONSTRAINT organization_user_user_org_group_type_key 
  UNIQUE (user_id, organization_id, group_id, user_type_id);