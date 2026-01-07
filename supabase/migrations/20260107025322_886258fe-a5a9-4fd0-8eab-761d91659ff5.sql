-- Add CHECK constraint to ensure succeeded orders have payment intent
ALTER TABLE orders
ADD CONSTRAINT orders_succeeded_requires_payment_intent
CHECK (
  status != 'succeeded' 
  OR stripe_payment_intent_id IS NOT NULL
);

-- Add comment for documentation
COMMENT ON CONSTRAINT orders_succeeded_requires_payment_intent ON orders IS 
  'Ensures orders can only be marked as succeeded if they have a valid Stripe payment intent ID';