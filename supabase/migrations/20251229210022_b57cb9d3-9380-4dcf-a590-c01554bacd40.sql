-- Add personal pitch fields to roster_member_campaign_links
ALTER TABLE roster_member_campaign_links
ADD COLUMN pitch_message TEXT DEFAULT NULL,
ADD COLUMN pitch_image_url TEXT DEFAULT NULL,
ADD COLUMN pitch_video_url TEXT DEFAULT NULL,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

COMMENT ON COLUMN roster_member_campaign_links.pitch_message IS 
  'Personal message from roster member to potential donors';
COMMENT ON COLUMN roster_member_campaign_links.pitch_image_url IS 
  'Optional photo URL for personal pitch';
COMMENT ON COLUMN roster_member_campaign_links.pitch_video_url IS 
  'Optional video URL for personal pitch (YouTube, Vimeo, etc.)';

-- Create storage bucket for pitch media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pitch-media', 'pitch-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own pitch folder
CREATE POLICY "Users can upload their own pitch media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'pitch-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update/delete their own pitch media
CREATE POLICY "Users can update their own pitch media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'pitch-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own pitch media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'pitch-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can view pitch media (it's public)
CREATE POLICY "Anyone can view pitch media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'pitch-media');

-- Add RLS policy for roster members to update their own pitch data
CREATE POLICY "Roster members can update their own pitch"
ON roster_member_campaign_links FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_user ou 
    WHERE ou.id = roster_member_campaign_links.roster_member_id 
    AND ou.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_user ou 
    WHERE ou.id = roster_member_campaign_links.roster_member_id 
    AND ou.user_id = auth.uid()
  )
);