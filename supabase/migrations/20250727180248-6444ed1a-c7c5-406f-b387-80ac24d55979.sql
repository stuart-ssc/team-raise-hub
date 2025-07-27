-- Create campaign_items table
CREATE TABLE public.campaign_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  image text,
  cost numeric,
  quantity_offered integer,
  quantity_available integer,
  max_items_purchased integer,
  size text,
  event_start_date date,
  event_end_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key constraint to campaigns table
ALTER TABLE public.campaign_items 
ADD CONSTRAINT fk_campaign_items_campaign_id 
FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.campaign_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaign items
-- Users with qualifying roles can view campaign items at their school
CREATE POLICY "Users with qualifying roles can view campaign items at their school"
ON public.campaign_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id)
    JOIN campaigns c ON (campaign_items.campaign_id = c.id)
    JOIN groups g ON (c.group_id = g.id)
    WHERE su.user_id = auth.uid()
    AND su.school_id = g.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

-- Users with qualifying roles can create campaign items at their school
CREATE POLICY "Users with qualifying roles can create campaign items at their school"
ON public.campaign_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id)
    JOIN campaigns c ON (campaign_items.campaign_id = c.id)
    JOIN groups g ON (c.group_id = g.id)
    WHERE su.user_id = auth.uid()
    AND su.school_id = g.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

-- Users with qualifying roles can update campaign items at their school
CREATE POLICY "Users with qualifying roles can update campaign items at their school"
ON public.campaign_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id)
    JOIN campaigns c ON (campaign_items.campaign_id = c.id)
    JOIN groups g ON (c.group_id = g.id)
    WHERE su.user_id = auth.uid()
    AND su.school_id = g.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

-- Users with qualifying roles can delete campaign items at their school
CREATE POLICY "Users with qualifying roles can delete campaign items at their school"
ON public.campaign_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id)
    JOIN campaigns c ON (campaign_items.campaign_id = c.id)
    JOIN groups g ON (c.group_id = g.id)
    WHERE su.user_id = auth.uid()
    AND su.school_id = g.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_campaign_items_updated_at
BEFORE UPDATE ON public.campaign_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();