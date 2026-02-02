-- Fix the link_donor_profile_on_signup function to work with profiles table
-- The profiles table doesn't have an email column, so we need to look it up from auth.users
CREATE OR REPLACE FUNCTION public.link_donor_profile_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
BEGIN
  -- Get the email from auth.users since profiles doesn't have an email column
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Link any existing donor_profiles with matching email to this new user
  IF user_email IS NOT NULL THEN
    UPDATE donor_profiles
    SET user_id = NEW.id
    WHERE LOWER(email) = LOWER(user_email)
    AND user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;