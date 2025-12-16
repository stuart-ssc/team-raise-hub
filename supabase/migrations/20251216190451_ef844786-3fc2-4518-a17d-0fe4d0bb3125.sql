-- One-time migration to update existing test orders to succeeded status

UPDATE orders
SET 
  status = 'succeeded',
  customer_email = 'test@example.com',
  customer_name = 'Test Customer',
  updated_at = now()
WHERE status = 'pending'
  AND customer_email = 'pending@example.com'
  AND created_at > now() - interval '7 days';

-- Link ABC Plumbing business to recent orders that should have it
UPDATE orders o
SET business_id = b.id
FROM businesses b
WHERE b.business_name = 'ABC Plumbing'
  AND o.business_id IS NULL
  AND o.business_purchase = true
  AND o.created_at > now() - interval '7 days';