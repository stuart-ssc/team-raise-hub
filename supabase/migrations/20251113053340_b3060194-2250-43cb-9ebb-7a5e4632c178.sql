-- Add email digest preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN email_digest_frequency text DEFAULT 'weekly' CHECK (email_digest_frequency IN ('none', 'daily', 'weekly')),
ADD COLUMN last_digest_sent_at timestamp with time zone;

-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;