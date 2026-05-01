-- Normalize KBC's verification_status from legacy 'verified' value to the
-- canonical 'approved' value expected by check_campaign_publish_eligibility.
UPDATE public.organizations
SET verification_status = 'approved',
    verification_approved_at = COALESCE(verification_approved_at, now())
WHERE id = '4dac1f3b-faa1-4714-ab1c-c2fe01be1023'
  AND verification_status = 'verified';
