-- Function to notify users when a new campaign is created
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

  -- Insert notifications for all users in the same school
  FOR user_record IN
    SELECT DISTINCT su.user_id
    FROM school_user su
    WHERE su.school_id = school_id_var
    AND su.active_user = true
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

-- Function to notify users when campaign goal is reached
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

    -- Insert notifications for all users in the same school
    FOR user_record IN
      SELECT DISTINCT su.user_id
      FROM school_user su
      WHERE su.school_id = school_id_var
      AND su.active_user = true
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

-- Create trigger for new campaigns
CREATE TRIGGER trigger_notify_new_campaign
AFTER INSERT ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_campaign();

-- Create trigger for campaign goal reached
CREATE TRIGGER trigger_notify_campaign_goal_reached
AFTER UPDATE ON public.campaigns
FOR EACH ROW
WHEN (NEW.amount_raised IS DISTINCT FROM OLD.amount_raised OR NEW.goal_amount IS DISTINCT FROM OLD.goal_amount)
EXECUTE FUNCTION public.notify_campaign_goal_reached();