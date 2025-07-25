-- Create function to automatically create roster when group is created
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Insert a new roster for the newly created group
  INSERT INTO public."Rosters" (group_id, roster_year, current_roster)
  VALUES (NEW.id, EXTRACT(YEAR FROM NOW()), true);
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically create roster when group is inserted
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_group();