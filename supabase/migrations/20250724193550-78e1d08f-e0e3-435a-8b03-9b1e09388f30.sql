-- Add RLS policies to allow certain user types to create groups
-- Users can create groups if they have a qualifying role

CREATE POLICY "Users with qualifying roles can create groups" 
ON public.groups 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.school_user su
    JOIN public.user_type ut ON su.user_type_id = ut.id
    WHERE su.user_id = auth.uid() 
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

-- Users can update groups if they have a qualifying role and the group belongs to their school
CREATE POLICY "Users with qualifying roles can update groups at their school" 
ON public.groups 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.school_user su
    JOIN public.user_type ut ON su.user_type_id = ut.id
    WHERE su.user_id = auth.uid() 
    AND su.school_id = groups.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);