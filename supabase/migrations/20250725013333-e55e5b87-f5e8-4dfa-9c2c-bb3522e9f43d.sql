-- Add group_id column to Rosters table
ALTER TABLE public."Rosters" 
ADD COLUMN group_id UUID REFERENCES public.groups(id);

-- Create index for better performance
CREATE INDEX idx_rosters_group_id ON public."Rosters"(group_id);

-- Create RLS policies for Rosters table
CREATE POLICY "Users with qualifying roles can view rosters at their school" 
ON public."Rosters" 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM school_user su
    JOIN user_type ut ON su.user_type_id = ut.id
    JOIN groups g ON "Rosters".group_id = g.id
    WHERE su.user_id = auth.uid() 
    AND su.school_id = g.school_id
    AND ut.name = ANY (ARRAY['Principal'::text, 'Athletic Director'::text, 'Coach'::text, 'Club Sponsor'::text, 'Booster Leader'::text])
  )
);

CREATE POLICY "Users with qualifying roles can create rosters at their school" 
ON public."Rosters" 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM school_user su
    JOIN user_type ut ON su.user_type_id = ut.id
    JOIN groups g ON "Rosters".group_id = g.id
    WHERE su.user_id = auth.uid() 
    AND su.school_id = g.school_id
    AND ut.name = ANY (ARRAY['Principal'::text, 'Athletic Director'::text, 'Coach'::text, 'Club Sponsor'::text, 'Booster Leader'::text])
  )
);

CREATE POLICY "Users with qualifying roles can update rosters at their school" 
ON public."Rosters" 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM school_user su
    JOIN user_type ut ON su.user_type_id = ut.id
    JOIN groups g ON "Rosters".group_id = g.id
    WHERE su.user_id = auth.uid() 
    AND su.school_id = g.school_id
    AND ut.name = ANY (ARRAY['Principal'::text, 'Athletic Director'::text, 'Coach'::text, 'Club Sponsor'::text, 'Booster Leader'::text])
  )
);

CREATE POLICY "Users with qualifying roles can delete rosters at their school" 
ON public."Rosters" 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM school_user su
    JOIN user_type ut ON su.user_type_id = ut.id
    JOIN groups g ON "Rosters".group_id = g.id
    WHERE su.user_id = auth.uid() 
    AND su.school_id = g.school_id
    AND ut.name = ANY (ARRAY['Principal'::text, 'Athletic Director'::text, 'Coach'::text, 'Club Sponsor'::text, 'Booster Leader'::text])
  )
);