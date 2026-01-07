-- Delete test orders without Stripe payment intent from Banner Sales campaign
DELETE FROM orders 
WHERE campaign_id = '1119569e-7893-43ba-aca7-763542f2778e'
  AND stripe_payment_intent_id IS NULL;

-- Update campaign amount_raised to match real orders
UPDATE campaigns 
SET amount_raised = (
  SELECT COALESCE(SUM(items_total), 0) 
  FROM orders 
  WHERE campaign_id = '1119569e-7893-43ba-aca7-763542f2778e'
    AND status = 'succeeded'
)
WHERE id = '1119569e-7893-43ba-aca7-763542f2778e';