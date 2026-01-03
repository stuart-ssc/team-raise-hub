-- Add pitch columns to campaigns table for campaign-level pitches
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS pitch_message TEXT,
ADD COLUMN IF NOT EXISTS pitch_image_url TEXT,
ADD COLUMN IF NOT EXISTS pitch_video_url TEXT,
ADD COLUMN IF NOT EXISTS pitch_recorded_video_url TEXT;