-- Add recurring donation fields to campaign_items table
ALTER TABLE campaign_items
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_interval TEXT CHECK (recurring_interval IS NULL OR recurring_interval IN ('month', 'year'));

-- Create subscriptions table to track recurring donations
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  donor_profile_id UUID REFERENCES donor_profiles(id),
  campaign_id UUID REFERENCES campaigns(id),
  campaign_item_id UUID REFERENCES campaign_items(id),
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  amount NUMERIC NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Organization users can view subscriptions for their campaigns
CREATE POLICY "Organization users can view subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    JOIN groups g ON c.group_id = g.id
    JOIN organization_user ou ON g.organization_id = ou.organization_id
    WHERE c.id = subscriptions.campaign_id
    AND ou.user_id = auth.uid()
    AND ou.active_user = true
  ) OR is_system_admin(auth.uid())
);

-- Policy: System admins can manage all subscriptions
CREATE POLICY "System admins can manage subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_campaign_id ON public.subscriptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_donor_profile_id ON public.subscriptions(donor_profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Create updated_at trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();