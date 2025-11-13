-- Add notification preference columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN notify_campaigns boolean DEFAULT true,
ADD COLUMN notify_orders boolean DEFAULT true,
ADD COLUMN notify_assignments boolean DEFAULT true;

-- Update the campaign notification function to check preferences
CREATE OR REPLACE FUNCTION public.notify_new_campaign()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  school_id_var uuid;
  user_record RECORD;
BEGIN
  -- Get the school_id from the group
  SELECT g.school_id INTO school_id_var
  FROM groups g
  WHERE g.id = NEW.group_id;

  -- Insert notifications for all users in the same school who have campaign notifications enabled
  FOR user_record IN
    SELECT DISTINCT su.user_id
    FROM school_user su
    JOIN profiles p ON su.user_id = p.id
    WHERE su.school_id = school_id_var
    AND su.active_user = true
    AND (p.notify_campaigns IS NULL OR p.notify_campaigns = true)
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      user_record.user_id,
      'New Campaign Created',
      'A new campaign "' || NEW.name || '" has been launched!',
      'info',
      '/campaigns'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Update the campaign goal notification function to check preferences
CREATE OR REPLACE FUNCTION public.notify_campaign_goal_reached()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  school_id_var uuid;
  user_record RECORD;
  goal_reached boolean;
  was_goal_reached boolean;
BEGIN
  -- Check if goal was reached after this update
  goal_reached := NEW.amount_raised >= NEW.goal_amount AND NEW.goal_amount > 0;
  
  -- Check if goal was already reached before this update
  was_goal_reached := OLD.amount_raised >= OLD.goal_amount AND OLD.goal_amount > 0;
  
  -- Only notify if goal just reached (not already reached)
  IF goal_reached AND NOT was_goal_reached THEN
    -- Get the school_id from the group
    SELECT g.school_id INTO school_id_var
    FROM groups g
    WHERE g.id = NEW.group_id;

    -- Insert notifications for all users in the same school who have campaign notifications enabled
    FOR user_record IN
      SELECT DISTINCT su.user_id
      FROM school_user su
      JOIN profiles p ON su.user_id = p.id
      WHERE su.school_id = school_id_var
      AND su.active_user = true
      AND (p.notify_campaigns IS NULL OR p.notify_campaigns = true)
    LOOP
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        user_record.user_id,
        'Campaign Goal Reached! 🎉',
        'The campaign "' || NEW.name || '" has reached its goal of $' || NEW.goal_amount || '!',
        'success',
        '/campaigns'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Update the order notification function to check preferences
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

  -- Notify all campaign managers who have order notifications enabled
  FOR user_record IN
    SELECT DISTINCT su.user_id
    FROM school_user su
    JOIN user_type ut ON su.user_type_id = ut.id
    JOIN profiles p ON su.user_id = p.id
    WHERE su.school_id = school_id_var
    AND su.active_user = true
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
    AND (p.notify_orders IS NULL OR p.notify_orders = true)
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

-- Update the user assignment notification function to check preferences
CREATE OR REPLACE FUNCTION public.notify_user_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  group_name_var text;
  user_type_name_var text;
  roster_year_var bigint;
  notify_enabled boolean;
BEGIN
  -- Check if user has assignment notifications enabled
  SELECT COALESCE(notify_assignments, true) INTO notify_enabled
  FROM profiles
  WHERE id = NEW.user_id;

  -- Only proceed if notifications are enabled
  IF NOT notify_enabled THEN
    RETURN NEW;
  END IF;

  -- Get group name and user type name
  SELECT g.group_name, ut.name
  INTO group_name_var, user_type_name_var
  FROM groups g, user_type ut
  WHERE g.id = NEW.group_id
  AND ut.id = NEW.user_type_id;

  -- Handle new user assignment (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Notify about group assignment
    IF NEW.roster_id IS NOT NULL THEN
      -- Get roster year
      SELECT roster_year INTO roster_year_var
      FROM rosters
      WHERE id = NEW.roster_id;
      
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        'Added to Team Roster',
        'You have been added to ' || group_name_var || ' (' || roster_year_var || ' roster) as ' || user_type_name_var,
        'success',
        '/dashboard/rosters'
      );
    ELSE
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        'Added to Group',
        'You have been added to ' || group_name_var || ' as ' || user_type_name_var,
        'success',
        '/dashboard/groups'
      );
    END IF;
  END IF;

  -- Handle updates to group or roster assignment
  IF TG_OP = 'UPDATE' THEN
    -- Check if group changed
    IF OLD.group_id IS DISTINCT FROM NEW.group_id THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        'Group Assignment Updated',
        'You have been assigned to ' || group_name_var || ' as ' || user_type_name_var,
        'info',
        '/dashboard/groups'
      );
    END IF;

    -- Check if roster changed
    IF OLD.roster_id IS DISTINCT FROM NEW.roster_id AND NEW.roster_id IS NOT NULL THEN
      SELECT roster_year INTO roster_year_var
      FROM rosters
      WHERE id = NEW.roster_id;
      
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        'Roster Assignment Updated',
        'You have been added to the ' || roster_year_var || ' roster for ' || group_name_var,
        'info',
        '/dashboard/rosters'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;