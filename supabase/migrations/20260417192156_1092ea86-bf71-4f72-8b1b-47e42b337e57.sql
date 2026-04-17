ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_not_deleted ON public.campaigns (id) WHERE deleted_at IS NULL;