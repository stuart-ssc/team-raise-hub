-- Add fee_model to campaigns
ALTER TABLE public.campaigns
  ADD COLUMN fee_model TEXT NOT NULL DEFAULT 'donor_covers'
    CHECK (fee_model IN ('donor_covers', 'org_absorbs'));

COMMENT ON COLUMN public.campaigns.fee_model IS
  'Controls how the 10% Sponsorly platform fee is applied at checkout. donor_covers (default) adds the fee on top of the cart total. org_absorbs silently deducts the fee from the org payout so the donor pays only the headline price.';

-- Add fee_model to orders (snapshot of campaign setting at time of purchase)
ALTER TABLE public.orders
  ADD COLUMN fee_model TEXT NOT NULL DEFAULT 'donor_covers'
    CHECK (fee_model IN ('donor_covers', 'org_absorbs'));

COMMENT ON COLUMN public.orders.fee_model IS
  'Snapshot of the campaign fee_model at the time the order was created. Used for accurate historical reporting.';