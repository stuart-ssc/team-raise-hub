-- Create school_type table
CREATE TABLE public.school_type (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster searching
CREATE INDEX idx_school_type_name ON public.school_type(name);

-- Enable Row Level Security
ALTER TABLE public.school_type ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for school type selection
CREATE POLICY "School types are publicly readable for selection" 
ON public.school_type 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_school_type_updated_at
  BEFORE UPDATE ON public.school_type
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add school_type_id column to schools table
ALTER TABLE public.schools 
ADD COLUMN school_type_id UUID REFERENCES public.school_type(id);

-- Create index for the foreign key
CREATE INDEX idx_schools_school_type_id ON public.schools(school_type_id);