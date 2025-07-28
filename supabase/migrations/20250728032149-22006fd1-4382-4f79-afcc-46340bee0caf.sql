-- Add image field to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN image_url text;