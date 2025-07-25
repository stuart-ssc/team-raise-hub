-- Update the function to fix the search path security warning
CREATE OR REPLACE FUNCTION public.set_school_user_roster()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if the user type should have a roster_id
  IF EXISTS (
    SELECT 1 FROM public.user_type ut 
    WHERE ut.id = NEW.user_type_id 
    AND ut.name NOT IN ('Principal', 'Athletic Director', 'Club Sponsor')
  ) THEN
    -- Set roster_id to the current roster for this group
    SELECT r.id INTO NEW.roster_id
    FROM public.rosters r
    WHERE r.group_id = NEW.group_id 
    AND r.current_roster = true
    LIMIT 1;
  ELSE
    -- For Principal, Athletic Director, and Club Sponsor, keep roster_id null
    NEW.roster_id = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;