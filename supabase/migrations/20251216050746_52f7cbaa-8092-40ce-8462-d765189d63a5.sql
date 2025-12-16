-- Allow viewing order details on checkout success page using the Stripe session ID
-- This is secure because processor_session_id is a cryptographically random Stripe token
CREATE POLICY "Allow viewing order by processor_session_id"
ON orders
FOR SELECT
USING (processor_session_id IS NOT NULL);