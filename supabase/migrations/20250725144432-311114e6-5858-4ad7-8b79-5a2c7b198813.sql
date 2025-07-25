-- Allow users to view profiles of other users in their school
CREATE POLICY "Users can view profiles of users in their school" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM school_user su1, school_user su2 
    WHERE su1.user_id = auth.uid() 
      AND su2.user_id = profiles.id 
      AND su1.school_id = su2.school_id
  )
);