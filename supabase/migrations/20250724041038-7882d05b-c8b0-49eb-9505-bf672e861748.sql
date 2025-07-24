-- Create school_districts table
CREATE TABLE public.school_districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nces_district_id TEXT,
  state_id BIGINT REFERENCES public.states(id),
  state_district_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster searching
CREATE INDEX idx_school_districts_name ON public.school_districts(name);
CREATE INDEX idx_school_districts_state_id ON public.school_districts(state_id);
CREATE INDEX idx_school_districts_nces_id ON public.school_districts(nces_district_id);

-- Enable Row Level Security
ALTER TABLE public.school_districts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for district selection
CREATE POLICY "School districts are publicly readable for selection" 
ON public.school_districts 
FOR SELECT 
USING (true);

-- Add school_district_id column to schools table
ALTER TABLE public.schools 
ADD COLUMN school_district_id UUID REFERENCES public.school_districts(id);

-- Create index for the foreign key
CREATE INDEX idx_schools_school_district_id ON public.schools(school_district_id);

-- Create trigger for automatic timestamp updates on school_districts table
CREATE TRIGGER update_school_districts_updated_at
  BEFORE UPDATE ON public.school_districts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();