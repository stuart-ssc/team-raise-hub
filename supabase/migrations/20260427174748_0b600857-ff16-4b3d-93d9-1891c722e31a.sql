-- Pledge Fundraisers — schema, RLS, seeds, triggers

-- 1) Seed the new campaign type
INSERT INTO public.campaign_type (name, description)
SELECT 'Pledge',
  'Supporters pledge an amount per unit (lap, point, mile, etc.) for an upcoming event. Cards are stored at pledge time and charged automatically after the event when the admin records the final unit count.'
WHERE NOT EXISTS (SELECT 1 FROM public.campaign_type WHERE name = 'Pledge');

-- 2) Campaigns columns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS pledge_unit_label TEXT,
  ADD COLUMN IF NOT EXISTS pledge_unit_label_plural TEXT,
  ADD COLUMN IF NOT EXISTS pledge_scope TEXT,
  ADD COLUMN IF NOT EXISTS pledge_event_date DATE,
  ADD COLUMN IF NOT EXISTS pledge_min_per_unit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS pledge_suggested_unit_amounts JSONB DEFAULT '[0.50, 1, 2, 5]'::jsonb;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='campaigns_pledge_scope_check') THEN
    ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_pledge_scope_check
      CHECK (pledge_scope IS NULL OR pledge_scope IN ('team','participant'));
  END IF;
END $$;

-- 3) Orders column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pledge_id UUID;

-- 4) pledges table
CREATE TABLE IF NOT EXISTS public.pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  attributed_roster_member_id UUID REFERENCES public.organization_user(id),
  amount_per_unit NUMERIC(10,2) NOT NULL CHECK (amount_per_unit > 0),
  max_total_amount NUMERIC(10,2),
  stripe_customer_id TEXT NOT NULL,
  stripe_setup_intent_id TEXT,
  stripe_payment_method_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending_setup'
    CHECK (status IN ('pending_setup','active','charging','charged','failed','requires_action','canceled')),
  units_charged_for INTEGER,
  calculated_charge_amount NUMERIC(10,2),
  final_charge_amount NUMERIC(10,2),
  charged_at TIMESTAMPTZ,
  charge_failure_reason TEXT,
  charge_failure_code TEXT,
  sca_confirm_token TEXT,
  sca_confirm_token_expires_at TIMESTAMPTZ,
  cancel_token TEXT,
  cancel_token_expires_at TIMESTAMPTZ,
  mandate_text_shown TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pledges_campaign_status ON public.pledges (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_pledges_attributed_roster_member ON public.pledges (attributed_roster_member_id);
CREATE INDEX IF NOT EXISTS idx_pledges_order ON public.pledges (order_id);
CREATE INDEX IF NOT EXISTS idx_pledges_setup_intent ON public.pledges (stripe_setup_intent_id);
CREATE INDEX IF NOT EXISTS idx_pledges_cancel_token ON public.pledges (cancel_token);

ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create pledges" ON public.pledges;
CREATE POLICY "Anyone can create pledges" ON public.pledges FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view pledges" ON public.pledges;
CREATE POLICY "Anyone can view pledges" ON public.pledges FOR SELECT USING (true);

-- 5) pledge_results table
CREATE TABLE IF NOT EXISTS public.pledge_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  attributed_roster_member_id UUID REFERENCES public.organization_user(id),
  units_completed INTEGER NOT NULL CHECK (units_completed >= 0),
  recorded_by UUID,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  charge_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (charge_status IN ('pending','processing','completed','partial_failure')),
  total_pledges_count INTEGER NOT NULL DEFAULT 0,
  total_pledges_charged INTEGER NOT NULL DEFAULT 0,
  total_pledges_failed INTEGER NOT NULL DEFAULT 0,
  total_amount_charged NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, attributed_roster_member_id)
);

CREATE INDEX IF NOT EXISTS idx_pledge_results_campaign ON public.pledge_results (campaign_id);

ALTER TABLE public.pledge_results ENABLE ROW LEVEL SECURITY;

-- Helper: who can manage pledge results for a given campaign
CREATE OR REPLACE FUNCTION public.can_manage_campaign_pledges(_campaign_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    JOIN public.groups g ON g.id = c.group_id
    JOIN public.organization_user ou
      ON ou.organization_id = g.organization_id
     AND (ou.group_id = c.group_id OR ou.group_id IS NULL)
    JOIN public.user_type ut ON ut.id = ou.user_type_id
    WHERE c.id = _campaign_id
      AND ou.user_id = _user_id
      AND COALESCE(ou.active_user, true) = true
      AND ut.name IN (
        'Principal','Athletic Director','Coach','Club Sponsor','Booster Leader',
        'Executive Director','Program Director'
      )
  );
$$;

DROP POLICY IF EXISTS "Campaign admins can view pledge results" ON public.pledge_results;
CREATE POLICY "Campaign admins can view pledge results"
  ON public.pledge_results FOR SELECT
  USING (public.can_manage_campaign_pledges(campaign_id, auth.uid()));

DROP POLICY IF EXISTS "Campaign admins can insert pledge results" ON public.pledge_results;
CREATE POLICY "Campaign admins can insert pledge results"
  ON public.pledge_results FOR INSERT
  WITH CHECK (public.can_manage_campaign_pledges(campaign_id, auth.uid()));

DROP POLICY IF EXISTS "Campaign admins can update pledge results" ON public.pledge_results;
CREATE POLICY "Campaign admins can update pledge results"
  ON public.pledge_results FOR UPDATE
  USING (public.can_manage_campaign_pledges(campaign_id, auth.uid()));

-- 6) updated_at triggers
DROP TRIGGER IF EXISTS update_pledges_updated_at ON public.pledges;
CREATE TRIGGER update_pledges_updated_at
  BEFORE UPDATE ON public.pledges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pledge_results_updated_at ON public.pledge_results;
CREATE TRIGGER update_pledge_results_updated_at
  BEFORE UPDATE ON public.pledge_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();