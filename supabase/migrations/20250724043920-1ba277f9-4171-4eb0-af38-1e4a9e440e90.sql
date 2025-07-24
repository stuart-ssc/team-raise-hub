-- Create group_type table
CREATE TABLE public.group_type (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster searching
CREATE INDEX idx_group_type_name ON public.group_type(name);

-- Enable Row Level Security
ALTER TABLE public.group_type ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for group type selection
CREATE POLICY "Group types are publicly readable for selection" 
ON public.group_type 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_group_type_updated_at
  BEFORE UPDATE ON public.group_type
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();