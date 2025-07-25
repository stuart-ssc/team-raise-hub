-- Add roster_id column to school_user table
ALTER TABLE public.school_user 
ADD COLUMN roster_id bigint REFERENCES public.rosters(id);

-- Create a function to automatically set roster_id based on user type
CREATE OR REPLACE FUNCTION public.set_school_user_roster()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set roster_id on insert and update
CREATE TRIGGER set_school_user_roster_trigger
  BEFORE INSERT OR UPDATE ON public.school_user
  FOR EACH ROW
  EXECUTE FUNCTION public.set_school_user_roster();