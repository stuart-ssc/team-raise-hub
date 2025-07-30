-- Create launch_interest table for contact form submissions
CREATE TABLE public.launch_interest (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  school_info TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.launch_interest ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public insertions (for form submissions)
CREATE POLICY "Anyone can submit launch interest form" 
ON public.launch_interest 
FOR INSERT 
WITH CHECK (true);

-- Create policy for qualified users to view submissions
CREATE POLICY "Users with qualifying roles can view launch interest submissions" 
ON public.launch_interest 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM school_user su
  JOIN user_type ut ON (su.user_type_id = ut.id)
  WHERE su.user_id = auth.uid() 
  AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_launch_interest_updated_at
BEFORE UPDATE ON public.launch_interest
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();