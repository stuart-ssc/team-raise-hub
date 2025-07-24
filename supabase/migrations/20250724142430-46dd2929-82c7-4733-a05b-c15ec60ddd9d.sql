-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL,
  logo_url TEXT,
  school_id UUID REFERENCES public.schools(id),
  group_type_id UUID REFERENCES public.group_type(id),
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for faster searching and joins
CREATE INDEX idx_groups_school_id ON public.groups(school_id);
CREATE INDEX idx_groups_group_type_id ON public.groups(group_type_id);
CREATE INDEX idx_groups_name ON public.groups(group_name);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for groups selection
CREATE POLICY "Groups are publicly readable for selection" 
ON public.groups 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();