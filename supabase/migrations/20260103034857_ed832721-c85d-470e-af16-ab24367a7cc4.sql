-- Phase 1: Link donor_profiles to auth users
-- Add user_id column to donor_profiles to link donors who created accounts
ALTER TABLE public.donor_profiles 
ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_donor_profiles_user_id ON public.donor_profiles(user_id);

-- Link existing donor_profiles to profiles based on matching emails
-- This connects donors who already created accounts
UPDATE public.donor_profiles dp
SET user_id = p.id
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE LOWER(dp.email) = LOWER(u.email)
AND dp.user_id IS NULL;

-- Create a function to check if a user is a donor-only user (has donor_profiles but no org membership)
CREATE OR REPLACE FUNCTION public.is_donor_only_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM donor_profiles 
    WHERE user_id = check_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM organization_user 
    WHERE user_id = check_user_id 
    AND active_user = true
  );
$$;

-- Create a trigger to automatically link donor_profiles when a user signs up
-- If a donor_profile exists with matching email, link it to the new user
CREATE OR REPLACE FUNCTION public.link_donor_profile_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Link any existing donor_profiles with matching email to this new user
  UPDATE donor_profiles
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
  AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (fires after handle_new_user inserts the profile)
CREATE TRIGGER on_profile_created_link_donor
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_donor_profile_on_signup();

-- Add RLS policy for donors to view their own donor_profiles
CREATE POLICY "Donors can view their own profiles"
ON public.donor_profiles
FOR SELECT
USING (user_id = auth.uid());

-- Add RLS policy for donors to update their own donor_profiles
CREATE POLICY "Donors can update their own profiles"
ON public.donor_profiles
FOR UPDATE
USING (user_id = auth.uid());