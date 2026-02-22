
-- Add signup_completed column to profiles
ALTER TABLE public.profiles ADD COLUMN signup_completed boolean NOT NULL DEFAULT false;

-- Backfill: mark users who have actually used the app as completed
-- Users whose profile has been updated (updated_at differs from created_at) have likely logged in
UPDATE public.profiles SET signup_completed = true WHERE updated_at != created_at;
