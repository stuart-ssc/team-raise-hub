-- Function to notify user when added to a group or roster
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
BEGIN
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

-- Create trigger for user assignments
CREATE TRIGGER trigger_notify_user_assignment
AFTER INSERT OR UPDATE ON public.school_user
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_assignment();