
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS event_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS event_location_name text,
  ADD COLUMN IF NOT EXISTS event_location_address text,
  ADD COLUMN IF NOT EXISTS event_format text,
  ADD COLUMN IF NOT EXISTS event_format_subtitle text,
  ADD COLUMN IF NOT EXISTS event_includes text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS event_includes_subtitle text,
  ADD COLUMN IF NOT EXISTS event_agenda jsonb DEFAULT '[]'::jsonb;
