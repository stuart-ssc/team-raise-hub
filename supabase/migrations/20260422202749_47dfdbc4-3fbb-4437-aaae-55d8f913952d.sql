CREATE OR REPLACE FUNCTION public.log_donor_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  changed_fields jsonb := '{}'::jsonb;
BEGIN
  IF OLD.first_name IS DISTINCT FROM NEW.first_name THEN
    changed_fields := changed_fields || jsonb_build_object(
      'first_name', jsonb_build_object('old', OLD.first_name, 'new', NEW.first_name));
  END IF;

  IF OLD.last_name IS DISTINCT FROM NEW.last_name THEN
    changed_fields := changed_fields || jsonb_build_object(
      'last_name', jsonb_build_object('old', OLD.last_name, 'new', NEW.last_name));
  END IF;

  IF OLD.email IS DISTINCT FROM NEW.email THEN
    changed_fields := changed_fields || jsonb_build_object(
      'email', jsonb_build_object('old', OLD.email, 'new', NEW.email));
  END IF;

  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    changed_fields := changed_fields || jsonb_build_object(
      'phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone));
  END IF;

  IF OLD.tags IS DISTINCT FROM NEW.tags THEN
    changed_fields := changed_fields || jsonb_build_object(
      'tags', jsonb_build_object('old', OLD.tags, 'new', NEW.tags));
  END IF;

  IF OLD.preferred_communication IS DISTINCT FROM NEW.preferred_communication THEN
    changed_fields := changed_fields || jsonb_build_object(
      'preferred_communication',
      jsonb_build_object('old', OLD.preferred_communication, 'new', NEW.preferred_communication));
  END IF;

  IF OLD.notes IS DISTINCT FROM NEW.notes THEN
    changed_fields := changed_fields || jsonb_build_object('notes_updated', true);
  END IF;

  -- Correct scalar guard: only log if something actually changed
  IF changed_fields <> '{}'::jsonb THEN
    INSERT INTO public.donor_activity_log (donor_id, activity_type, activity_data)
    VALUES (
      NEW.id,
      'profile_update',
      jsonb_build_object(
        'changed_fields', changed_fields,
        'updated_at', NEW.updated_at
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;