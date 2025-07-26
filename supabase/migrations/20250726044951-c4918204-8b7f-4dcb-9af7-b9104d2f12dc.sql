-- Create campaigns table
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  goal_amount numeric(10,2),
  amount_raised numeric(10,2) DEFAULT 0,
  start_date date,
  end_date date,
  status boolean DEFAULT true,
  group_id uuid REFERENCES public.groups(id),
  campaign_type_id uuid REFERENCES public.campaign_type(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Users with qualifying roles can view campaigns at their school" 
ON public.campaigns 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id)
    JOIN groups g ON (campaigns.group_id = g.id)
    WHERE su.user_id = auth.uid() 
    AND su.school_id = g.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

CREATE POLICY "Users with qualifying roles can create campaigns at their school" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id)
    JOIN groups g ON (campaigns.group_id = g.id)
    WHERE su.user_id = auth.uid() 
    AND su.school_id = g.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

CREATE POLICY "Users with qualifying roles can update campaigns at their school" 
ON public.campaigns 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id)
    JOIN groups g ON (campaigns.group_id = g.id)
    WHERE su.user_id = auth.uid() 
    AND su.school_id = g.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();