
-- Update the foreign key constraint to use organization_user instead of school_user
-- This aligns with the polymorphic organization model

-- First, drop the existing constraint
ALTER TABLE roster_member_campaign_links 
DROP CONSTRAINT IF EXISTS roster_member_campaign_links_roster_member_id_fkey;

-- Add new constraint referencing organization_user
ALTER TABLE roster_member_campaign_links
ADD CONSTRAINT roster_member_campaign_links_roster_member_id_fkey 
FOREIGN KEY (roster_member_id) REFERENCES organization_user(id) ON DELETE CASCADE;

-- Now insert the roster member campaign link for Taylor Player
INSERT INTO roster_member_campaign_links (
  campaign_id,
  roster_member_id,
  slug
) VALUES (
  '1119569e-7893-43ba-aca7-763542f2778e',  -- Banner Sales campaign
  '47ddbeb5-0437-43b2-ae7b-e689fe7eebdc',  -- Taylor Player's organization_user id
  'taylor-player'                           -- URL slug
) ON CONFLICT (campaign_id, roster_member_id) DO NOTHING;
