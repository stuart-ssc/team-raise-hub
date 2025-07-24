-- Add state_id column to schools table referencing states table
ALTER TABLE public.schools 
ADD COLUMN state_id BIGINT REFERENCES public.states(id);

-- Create index for the foreign key
CREATE INDEX idx_schools_state_id ON public.schools(state_id);

-- Enable Row Level Security on states table
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for state selection
CREATE POLICY "States are publicly readable for selection" 
ON public.states 
FOR SELECT 
USING (true);