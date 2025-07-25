-- Update the school_user SELECT policy to allow viewing users in the same school
DROP POLICY IF EXISTS "Users can view their own school_user record" ON school_user;

-- Create new policy that allows users to view school_user records in their school
CREATE POLICY "Users can view school_user records in their school" 
ON school_user 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM school_user viewer 
    WHERE viewer.user_id = auth.uid() 
    AND viewer.school_id = school_user.school_id
  )
);