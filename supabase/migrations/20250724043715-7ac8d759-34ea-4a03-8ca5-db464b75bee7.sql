-- Create campaign_type table
CREATE TABLE public.campaign_type (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster searching
CREATE INDEX idx_campaign_type_name ON public.campaign_type(name);

-- Enable Row Level Security
ALTER TABLE public.campaign_type ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for campaign type selection
CREATE POLICY "Campaign types are publicly readable for selection" 
ON public.campaign_type 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_campaign_type_updated_at
  BEFORE UPDATE ON public.campaign_type
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();