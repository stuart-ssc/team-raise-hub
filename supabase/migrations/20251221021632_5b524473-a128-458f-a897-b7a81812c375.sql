-- Fix Banner Sales campaign amount_raised for Donor Five order ($500 net after platform fee)
UPDATE public.campaigns 
SET amount_raised = COALESCE(amount_raised, 0) + 500, updated_at = NOW() 
WHERE id = '1119569e-7893-43ba-aca7-763542f2778e';