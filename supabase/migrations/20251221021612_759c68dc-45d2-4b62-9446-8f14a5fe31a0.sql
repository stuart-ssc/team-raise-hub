-- Create function to increment campaign amount raised
CREATE OR REPLACE FUNCTION public.increment_campaign_amount(campaign_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.campaigns
  SET
    amount_raised = COALESCE(amount_raised, 0) + amount,
    updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;