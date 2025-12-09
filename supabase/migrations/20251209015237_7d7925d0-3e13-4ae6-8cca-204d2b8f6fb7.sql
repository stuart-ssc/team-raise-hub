-- Create stripe_connect_accounts table
CREATE TABLE public.stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  payout_schedule TEXT DEFAULT 'daily',
  minimum_payout_amount INTEGER DEFAULT 2500,
  business_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT one_owner CHECK (
    (organization_id IS NOT NULL AND group_id IS NULL) OR 
    (organization_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Create stripe_payouts table
CREATE TABLE public.stripe_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_connect_account_id UUID REFERENCES public.stripe_connect_accounts(id) ON DELETE CASCADE,
  stripe_payout_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  arrival_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add Stripe columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Enable RLS
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for stripe_connect_accounts
CREATE POLICY "Organization admins can view their connect accounts"
ON public.stripe_connect_accounts FOR SELECT
USING (
  (organization_id IS NOT NULL AND user_belongs_to_organization(auth.uid(), organization_id))
  OR
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM groups g
    JOIN organization_user ou ON g.organization_id = ou.organization_id
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE g.id = stripe_connect_accounts.group_id
    AND ou.user_id = auth.uid()
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  ))
  OR is_system_admin(auth.uid())
);

CREATE POLICY "Organization admins can manage their connect accounts"
ON public.stripe_connect_accounts FOR ALL
USING (
  (organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id = stripe_connect_accounts.organization_id
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  ))
  OR
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM groups g
    JOIN organization_user ou ON g.organization_id = ou.organization_id
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE g.id = stripe_connect_accounts.group_id
    AND ou.user_id = auth.uid()
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  ))
  OR is_system_admin(auth.uid())
);

-- RLS policies for stripe_payouts
CREATE POLICY "Account owners can view payouts"
ON public.stripe_payouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stripe_connect_accounts sca
    WHERE sca.id = stripe_payouts.stripe_connect_account_id
    AND (
      (sca.organization_id IS NOT NULL AND user_belongs_to_organization(auth.uid(), sca.organization_id))
      OR
      (sca.group_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM groups g
        JOIN organization_user ou ON g.organization_id = ou.organization_id
        WHERE g.id = sca.group_id AND ou.user_id = auth.uid()
      ))
    )
  )
  OR is_system_admin(auth.uid())
);

-- Create updated_at trigger for stripe_connect_accounts
CREATE TRIGGER update_stripe_connect_accounts_updated_at
BEFORE UPDATE ON public.stripe_connect_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();