-- Update the trigger function to use the correct table name "rosters"
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Insert a new roster for the newly created group
  INSERT INTO public.rosters (group_id, roster_year, current_roster)
  VALUES (NEW.id, EXTRACT(YEAR FROM NOW())::bigint, true);
  
  RETURN NEW;
END;
$function$;