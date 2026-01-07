-- Create function to sync campaign amount_raised from orders
CREATE OR REPLACE FUNCTION public.sync_campaign_amount_raised()
RETURNS TRIGGER AS $$
DECLARE
  target_campaign_id UUID;
BEGIN
  -- Determine which campaign to update
  IF TG_OP = 'DELETE' THEN
    target_campaign_id := OLD.campaign_id;
  ELSE
    target_campaign_id := NEW.campaign_id;
  END IF;
  
  -- Handle campaign_id changes on UPDATE - recalculate old campaign first
  IF TG_OP = 'UPDATE' AND OLD.campaign_id IS DISTINCT FROM NEW.campaign_id AND OLD.campaign_id IS NOT NULL THEN
    UPDATE campaigns 
    SET amount_raised = COALESCE((
      SELECT SUM(items_total) 
      FROM orders 
      WHERE campaign_id = OLD.campaign_id 
        AND status = 'succeeded'
    ), 0),
    updated_at = NOW()
    WHERE id = OLD.campaign_id;
  END IF;
  
  -- Recalculate target campaign total
  IF target_campaign_id IS NOT NULL THEN
    UPDATE campaigns 
    SET amount_raised = COALESCE((
      SELECT SUM(items_total) 
      FROM orders 
      WHERE campaign_id = target_campaign_id 
        AND status = 'succeeded'
    ), 0),
    updated_at = NOW()
    WHERE id = target_campaign_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on orders table
CREATE TRIGGER trigger_sync_campaign_amount_raised
AFTER INSERT OR UPDATE OF status, items_total, campaign_id 
    OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_campaign_amount_raised();