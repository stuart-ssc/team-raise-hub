-- Fix the send_donation_email_on_order trigger function to use hardcoded URL
-- instead of relying on database settings that may be null

CREATE OR REPLACE FUNCTION public.send_donation_email_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only send email when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Use hardcoded URL for the edge function
    function_url := 'https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/send-donation-confirmation';
    service_role_key := current_setting('app.settings.service_role_key', true);

    -- Only proceed if we have the service role key
    IF service_role_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object('orderId', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;