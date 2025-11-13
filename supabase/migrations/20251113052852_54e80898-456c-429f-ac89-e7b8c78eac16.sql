-- Function to notify campaign managers when an order is placed
CREATE OR REPLACE FUNCTION public.notify_campaign_managers_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  campaign_name_var text;
  school_id_var uuid;
  user_record RECORD;
  order_total_formatted text;
BEGIN
  -- Only notify for successful orders
  IF NEW.status NOT IN ('pending', 'succeeded', 'completed') THEN
    RETURN NEW;
  END IF;

  -- Get campaign name and school_id
  SELECT c.name, g.school_id
  INTO campaign_name_var, school_id_var
  FROM campaigns c
  JOIN groups g ON c.group_id = g.id
  WHERE c.id = NEW.campaign_id;

  -- Format the order total
  order_total_formatted := '$' || ROUND(NEW.total_amount::numeric, 2)::text;

  -- Notify all campaign managers (users with qualifying roles at the school)
  FOR user_record IN
    SELECT DISTINCT su.user_id
    FROM school_user su
    JOIN user_type ut ON su.user_type_id = ut.id
    WHERE su.school_id = school_id_var
    AND su.active_user = true
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      user_record.user_id,
      'New Order Received',
      'New order of ' || order_total_formatted || ' for campaign "' || campaign_name_var || '"' || 
      CASE 
        WHEN NEW.customer_name IS NOT NULL THEN ' from ' || NEW.customer_name
        ELSE ''
      END,
      'success',
      '/dashboard/campaigns'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for new orders
CREATE TRIGGER trigger_notify_campaign_managers_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_campaign_managers_new_order();