-- Fix infinite recursion in school_user RLS policy
DROP POLICY IF EXISTS "Users can view school_user records in their school" ON school_user;

-- Create a security definer function to check if user belongs to a school
CREATE OR REPLACE FUNCTION public.user_belongs_to_school(user_id uuid, school_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM school_user 
    WHERE school_user.user_id = user_belongs_to_school.user_id 
    AND school_user.school_id = user_belongs_to_school.school_id
  );
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view school_user records in their school" 
ON school_user 
FOR SELECT 
USING (public.user_belongs_to_school(auth.uid(), school_id));