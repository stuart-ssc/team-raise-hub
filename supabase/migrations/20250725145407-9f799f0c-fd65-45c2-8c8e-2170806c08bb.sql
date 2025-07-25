-- Drop the existing restrictive UPDATE policy
DROP POLICY "Users can update their own school_user record" ON public.school_user;

-- Create a new UPDATE policy that allows authorized roles to update school_user records in their school
CREATE POLICY "Users can update school_user records in their school" 
ON public.school_user 
FOR UPDATE 
USING (
  -- Users can update their own record
  auth.uid() = user_id 
  OR 
  -- OR users with qualifying roles can update records for users in their school
  EXISTS (
    SELECT 1 
    FROM school_user su1
    JOIN user_type ut ON (su1.user_type_id = ut.id)
    JOIN school_user su2 ON (su1.school_id = su2.school_id)
    WHERE su1.user_id = auth.uid() 
      AND su2.id = school_user.id
      AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);