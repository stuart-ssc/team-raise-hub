-- Fix the trigger function to handle the quoted table name properly
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Insert a new roster for the newly created group
  INSERT INTO public."Rosters" (group_id, roster_year, current_roster)
  VALUES (NEW.id, EXTRACT(YEAR FROM NOW())::bigint, true);
  
  RETURN NEW;
END;
$function$;