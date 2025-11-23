-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to send donation confirmation email when order is created
CREATE OR REPLACE FUNCTION send_donation_email_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url text;
  service_role_key text;
BEGIN
  -- Only send email for successful orders with customer email
  IF NEW.status IN ('pending', 'succeeded', 'completed') AND NEW.customer_email IS NOT NULL THEN
    -- Get function URL and service role key from environment
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-donation-confirmation';
    service_role_key := current_setting('app.settings.supabase_service_role_key', true);
    
    -- Make async HTTP call to edge function
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object('orderId', NEW.id::text)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for donation confirmation emails
DROP TRIGGER IF EXISTS trigger_send_donation_email ON orders;
CREATE TRIGGER trigger_send_donation_email
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION send_donation_email_on_order();

-- Update the existing notify_campaign_goal_reached function to also send email
CREATE OR REPLACE FUNCTION public.notify_campaign_goal_reached()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  school_id_var uuid;
  user_record RECORD;
  goal_reached boolean;
  was_goal_reached boolean;
  function_url text;
  service_role_key text;
BEGIN
  -- Check if goal was reached after this update
  goal_reached := NEW.amount_raised >= NEW.goal_amount AND NEW.goal_amount > 0;
  
  -- Check if goal was already reached before this update
  was_goal_reached := OLD.amount_raised >= OLD.goal_amount AND OLD.goal_amount > 0;
  
  -- Only notify if goal just reached (not already reached)
  IF goal_reached AND NOT was_goal_reached THEN
    -- Get the school_id from the group (if applicable)
    SELECT g.school_id INTO school_id_var
    FROM groups g
    WHERE g.id = NEW.group_id;

    -- Insert in-app notifications for all users in the same organization who have campaign notifications enabled
    FOR user_record IN
      SELECT DISTINCT ou.user_id
      FROM organization_user ou
      JOIN profiles p ON ou.user_id = p.id
      JOIN groups g ON ou.organization_id = g.organization_id
      WHERE g.id = NEW.group_id
      AND ou.active_user = true
      AND (p.notify_campaigns IS NULL OR p.notify_campaigns = true)
    LOOP
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        user_record.user_id,
        'Campaign Goal Reached! 🎉',
        'The campaign "' || NEW.name || '" has reached its goal of $' || (NEW.goal_amount / 100)::text || '!',
        'success',
        '/campaigns'
      );
    END LOOP;
    
    -- Send email notification via edge function
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-campaign-milestone';
    service_role_key := current_setting('app.settings.supabase_service_role_key', true);
    
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'campaignId', NEW.id::text,
        'milestoneType', 'goal_reached'
      )
    );
  END IF;

  RETURN NEW;
END;
$$;