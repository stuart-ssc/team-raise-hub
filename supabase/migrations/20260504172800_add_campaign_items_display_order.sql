-- Add display_order to campaign_items for custom ordering on landing pages
ALTER TABLE public.campaign_items
ADD COLUMN IF NOT EXISTS display_order integer;

WITH ranked AS (
  SELECT id, (ROW_NUMBER() OVER (PARTITION BY campaign_id ORDER BY name) - 1)::int AS rn
  FROM public.campaign_items
)
UPDATE public.campaign_items ci
SET display_order = r.rn
FROM ranked r
WHERE ci.id = r.id AND ci.display_order IS NULL;
