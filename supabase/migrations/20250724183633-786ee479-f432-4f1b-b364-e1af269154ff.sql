-- Create school_user table to link users to schools and groups
CREATE TABLE public.school_user (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_type_id UUID NOT NULL REFERENCES public.user_type(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- Each user can only belong to one school/group combination
);

-- Enable Row Level Security
ALTER TABLE public.school_user ENABLE ROW LEVEL SECURITY;

-- Create policies for school_user access
CREATE POLICY "Users can view their own school_user record" 
ON public.school_user 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own school_user record" 
ON public.school_user 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own school_user record" 
ON public.school_user 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_school_user_updated_at
BEFORE UPDATE ON public.school_user
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();