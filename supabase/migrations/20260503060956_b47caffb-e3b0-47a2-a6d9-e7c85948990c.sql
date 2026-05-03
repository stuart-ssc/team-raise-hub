ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS merch_ships_by_date date,
  ADD COLUMN IF NOT EXISTS merch_pickup_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS merch_pickup_note text,
  ADD COLUMN IF NOT EXISTS merch_shipping_flat_rate numeric;