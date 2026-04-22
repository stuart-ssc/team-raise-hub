

## Problem
Saving the donor edit dialog throws `"query returned more than one row"`. The donor row itself is fine (single row by primary key). The error comes from a **database trigger**, not the client.

## Root cause
The `log_donor_profile_update` trigger on `public.donor_profiles` (AFTER UPDATE) contains:

```sql
IF jsonb_object_keys(changed_fields) IS NOT NULL THEN
  INSERT INTO donor_activity_log ...
END IF;
```

`jsonb_object_keys()` is a **set-returning function** — it returns one row per key in the JSONB. When the user changes more than one field at a time (e.g., `phone` + `updated_at`, or `first_name` + `phone`), the function returns multiple rows, and PL/pgSQL refuses to coerce that into a single boolean for the `IF` expression. Postgres raises `query returned more than one row`, the UPDATE is rolled back, and PostgREST surfaces it as the toast.

This is why the previous Taylor save (only `phone`) silently succeeded under RLS but the current save (after the RLS fix) actually reaches the trigger and explodes whenever multiple tracked fields differ.

## Fix
Replace the bad guard in `public.log_donor_profile_update` with a proper scalar check, and only insert the activity-log row when there is actually something to log.

New migration with:

```sql
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
```

No client changes needed.

## Files touched
- New Supabase migration replacing `public.log_donor_profile_update`.

## Verification
- As Taylor, edit Donor Five, change first name + phone in one save → no error toast, success toast appears, both fields persist in `donor_profiles`, and one new row is added to `donor_activity_log` with `activity_type = 'profile_update'` listing both changes.
- Editing a single field (just phone) still logs correctly.
- Saving with no changes → still no log row, no error.
- Admin / manager edits behave the same way (they were silently rolled back before this fix any time they changed >1 tracked field — now they succeed and log).
