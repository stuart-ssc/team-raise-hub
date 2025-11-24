-- Schedule the business nurture campaigns to run daily at 9 AM
SELECT cron.schedule(
  'process-business-campaigns-daily',
  '0 9 * * *', -- 9 AM every day
  $$
  SELECT
    net.http_post(
      url:='https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/process-business-nurture-campaigns',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcmVibWhpb25wdW93cHplZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDA0NTksImV4cCI6MjA2ODg3NjQ1OX0.Jw7c0qDfsdvxF3U6IQrjddVxbbRATTLz-RlPw5yYmxY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job WHERE jobname = 'process-business-campaigns-daily';
