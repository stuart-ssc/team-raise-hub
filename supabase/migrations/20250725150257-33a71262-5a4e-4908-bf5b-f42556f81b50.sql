-- Drop the problematic policy
DROP POLICY "Users can update school_user records in their school" ON public.school_user;

-- Create a security definer function to check if user can update school_user records
CREATE OR REPLACE FUNCTION public.can_update_school_user(target_school_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM school_user su1
    JOIN user_type ut ON (su1.user_type_id = ut.id)
    JOIN school_user su2 ON (su1.school_id = su2.school_id)
    WHERE su1.user_id = auth.uid() 
      AND su2.id = target_school_user_id
      AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  );
$$;

-- Create the new UPDATE policy using the security definer function
CREATE POLICY "Users can update school_user records in their school" 
ON public.school_user 
FOR UPDATE 
USING (
  -- Users can update their own record
  auth.uid() = user_id 
  OR 
  -- OR users with qualifying roles can update records for users in their school
  public.can_update_school_user(id)
);