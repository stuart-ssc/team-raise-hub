-- Rename notify_orders column to notify_donations in profiles table
ALTER TABLE public.profiles
RENAME COLUMN notify_orders TO notify_donations;

-- Update the notification function to use the new column name
CREATE OR REPLACE FUNCTION public.notify_campaign_managers_new_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Notify all campaign managers who have donation notifications enabled
  FOR user_record IN
    SELECT DISTINCT su.user_id
    FROM school_user su
    JOIN user_type ut ON su.user_type_id = ut.id
    JOIN profiles p ON su.user_id = p.id
    WHERE su.school_id = school_id_var
    AND su.active_user = true
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
    AND (p.notify_donations IS NULL OR p.notify_donations = true)
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      user_record.user_id,
      'New Donation Received',
      'New donation of ' || order_total_formatted || ' for campaign "' || campaign_name_var || '"' || 
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
$function$;