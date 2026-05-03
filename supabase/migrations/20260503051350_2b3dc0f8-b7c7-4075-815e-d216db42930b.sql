ALTER TABLE public.campaign_items
  ADD COLUMN IF NOT EXISTS show_in_hero_stats boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_stat_label text,
  ADD COLUMN IF NOT EXISTS collect_attendee_names boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attendees_per_unit integer NOT NULL DEFAULT 1;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS event_details_heading text,
  ADD COLUMN IF NOT EXISTS event_details_heading_accent text,
  ADD COLUMN IF NOT EXISTS event_agenda_heading text,
  ADD COLUMN IF NOT EXISTS event_agenda_heading_accent text,
  ADD COLUMN IF NOT EXISTS event_includes_heading text;

ALTER TABLE public.organization_user
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS attendees jsonb;