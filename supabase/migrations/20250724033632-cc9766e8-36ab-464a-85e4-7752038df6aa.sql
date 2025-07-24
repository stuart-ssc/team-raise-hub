-- Create locale table for school locale types
CREATE TABLE public.locale (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  locale_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster searching
CREATE INDEX idx_locale_code ON public.locale(locale_code);

-- Enable Row Level Security
ALTER TABLE public.locale ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for locale selection
CREATE POLICY "Locales are publicly readable for selection" 
ON public.locale 
FOR SELECT 
USING (true);

-- Add locale_id column to schools table
ALTER TABLE public.schools 
ADD COLUMN locale_id UUID REFERENCES public.locale(id);

-- Create index for the foreign key
CREATE INDEX idx_schools_locale_id ON public.schools(locale_id);

-- Create trigger for automatic timestamp updates on locale table
CREATE TRIGGER update_locale_updated_at
  BEFORE UPDATE ON public.locale
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();