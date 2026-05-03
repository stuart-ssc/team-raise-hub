
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS donation_suggested_amounts jsonb DEFAULT '[25, 50, 100, 250, 500, 1000]'::jsonb,
  ADD COLUMN IF NOT EXISTS donation_min_amount numeric DEFAULT 5,
  ADD COLUMN IF NOT EXISTS donation_allow_recurring boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS donation_allow_dedication boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS donation_allocations jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dedication_type text,
  ADD COLUMN IF NOT EXISTS dedication_name text;
