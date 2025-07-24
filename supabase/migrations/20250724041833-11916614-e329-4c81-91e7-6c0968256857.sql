-- Create counties table
CREATE TABLE public.counties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  county_name TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster searching
CREATE INDEX idx_counties_county_name ON public.counties(county_name);
CREATE INDEX idx_counties_state ON public.counties(state);
CREATE INDEX idx_counties_state_county ON public.counties(state, county_name);

-- Enable Row Level Security
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for county selection
CREATE POLICY "Counties are publicly readable for selection" 
ON public.counties 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_counties_updated_at
  BEFORE UPDATE ON public.counties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();