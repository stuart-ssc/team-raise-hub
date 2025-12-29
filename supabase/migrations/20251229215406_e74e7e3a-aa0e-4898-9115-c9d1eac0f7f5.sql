-- Add column for recorded video (separate from external video links)
ALTER TABLE roster_member_campaign_links
ADD COLUMN IF NOT EXISTS pitch_recorded_video_url TEXT DEFAULT NULL;

COMMENT ON COLUMN roster_member_campaign_links.pitch_recorded_video_url IS 
  'URL for self-recorded video stored in Supabase Storage (pitch-media bucket)';