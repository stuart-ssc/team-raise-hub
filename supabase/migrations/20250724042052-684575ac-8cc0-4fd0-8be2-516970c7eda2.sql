-- Add county_id column to schools table referencing counties table
ALTER TABLE public.schools 
ADD COLUMN county_id UUID REFERENCES public.counties(id);

-- Create index for the foreign key
CREATE INDEX idx_schools_county_id ON public.schools(county_id);