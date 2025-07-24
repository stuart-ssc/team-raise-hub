-- Create schools table for public school data
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster searching
CREATE INDEX idx_schools_name ON public.schools(school_name);
CREATE INDEX idx_schools_city_state ON public.schools(city, state);

-- Enable Row Level Security (schools will be publicly readable for signup)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for school selection
CREATE POLICY "Schools are publicly readable for selection" 
ON public.schools 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();