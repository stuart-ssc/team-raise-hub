-- 1. Add is_sponsorship_item to campaign_items
ALTER TABLE public.campaign_items
  ADD COLUMN IF NOT EXISTS is_sponsorship_item boolean NOT NULL DEFAULT false;

-- 2. Add campaign_item_id (nullable) to campaign_required_assets
ALTER TABLE public.campaign_required_assets
  ADD COLUMN IF NOT EXISTS campaign_item_id uuid NULL
    REFERENCES public.campaign_items(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_campaign_required_assets_campaign_item_id
  ON public.campaign_required_assets(campaign_item_id);

-- 3. Backfill: any item belonging to a Sponsorship-type campaign is a sponsorship item
UPDATE public.campaign_items ci
SET is_sponsorship_item = true
FROM public.campaigns c
LEFT JOIN public.campaign_type ct ON ct.id = c.campaign_type_id
WHERE ci.campaign_id = c.id
  AND ci.is_sponsorship_item = false
  AND (
    c.requires_business_info = true
    OR lower(coalesce(ct.name, '')) LIKE '%sponsor%'
  );
