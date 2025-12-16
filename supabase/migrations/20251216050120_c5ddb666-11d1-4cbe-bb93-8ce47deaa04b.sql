-- Add thank_you_message column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN thank_you_message text;