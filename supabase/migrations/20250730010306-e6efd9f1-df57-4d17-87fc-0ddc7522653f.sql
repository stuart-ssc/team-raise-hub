-- Add Stripe Connect fields to groups table
ALTER TABLE public.groups 
ADD COLUMN stripe_account_id TEXT,
ADD COLUMN stripe_account_enabled BOOLEAN DEFAULT false;

-- Create orders table to track purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  customer_email TEXT,
  customer_name TEXT,
  shipping_address JSONB,
  items JSONB NOT NULL, -- Array of purchased items with quantities and prices
  application_fee_amount NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users with qualifying roles can view orders for their campaigns
CREATE POLICY "Campaign managers can view campaign orders" 
ON public.orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM ((school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id))
    JOIN campaigns c ON (orders.campaign_id = c.id))
    JOIN groups g ON (c.group_id = g.id)
  WHERE su.user_id = auth.uid() 
    AND su.school_id = g.school_id 
    AND ut.name = ANY (ARRAY['Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader'])
));

-- Edge functions can insert and update orders (using service role key)
CREATE POLICY "Edge functions can manage orders" 
ON public.orders 
FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();