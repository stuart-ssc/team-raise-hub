ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS hero_accent_word text;
ALTER TABLE public.campaign_items ADD COLUMN IF NOT EXISTS is_most_popular boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaign_items ADD COLUMN IF NOT EXISTS feature_bullets jsonb NOT NULL DEFAULT '[]'::jsonb;