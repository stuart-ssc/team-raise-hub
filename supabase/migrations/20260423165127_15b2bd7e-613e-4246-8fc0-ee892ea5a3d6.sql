-- Ensure pg_cron and pg_net extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the fundraiser outreach dispatcher every 15 minutes
DO $$
BEGIN
  -- Unschedule existing job if it exists (idempotent)
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'dispatch-fundraiser-outreach-every-15-min') THEN
    PERFORM cron.unschedule('dispatch-fundraiser-outreach-every-15-min');
  END IF;
END $$;

SELECT cron.schedule(
  'dispatch-fundraiser-outreach-every-15-min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/dispatch-fundraiser-outreach',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcmVibWhpb25wdW93cHplZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDA0NTksImV4cCI6MjA2ODg3NjQ1OX0.Jw7c0qDfsdvxF3U6IQrjddVxbbRATTLz-RlPw5yYmxY'
    ),
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);