-- Add internal directions field for group members
ALTER TABLE campaigns
ADD COLUMN group_directions TEXT DEFAULT NULL;

COMMENT ON COLUMN campaigns.group_directions IS 
  'Internal instructions visible only to group members - not shown publicly';