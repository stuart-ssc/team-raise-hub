ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS merch_items_heading text,
ADD COLUMN IF NOT EXISTS merch_items_subheading text;