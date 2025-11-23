-- Update the send_donation_email_on_order function to also generate tax receipts for nonprofits
CREATE OR REPLACE FUNCTION public.send_donation_email_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  function_url text;
  service_role_key text;
  org_type text;
BEGIN
  -- Only send email for successful orders with customer email
  IF NEW.status IN ('pending', 'succeeded', 'completed') AND NEW.customer_email IS NOT NULL THEN
    -- Get function URL and service role key from environment
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-donation-confirmation';
    service_role_key := current_setting('app.settings.supabase_service_role_key', true);
    
    -- Make async HTTP call to donation confirmation edge function
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object('orderId', NEW.id::text)
    );

    -- Check if this is a nonprofit organization for tax receipt generation
    SELECT o.organization_type INTO org_type
    FROM campaigns c
    JOIN groups g ON c.group_id = g.id
    JOIN organizations o ON g.organization_id = o.id
    WHERE c.id = NEW.campaign_id;

    -- If nonprofit, generate tax receipt
    IF org_type = 'nonprofit' THEN
      function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/generate-tax-receipt';
      
      PERFORM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object('orderId', NEW.id::text)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;