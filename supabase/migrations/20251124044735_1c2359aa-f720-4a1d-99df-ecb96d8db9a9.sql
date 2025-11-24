-- Add access token and expiration to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS access_token uuid DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamp with time zone DEFAULT (now() + interval '90 days');

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders(access_token);

-- Backfill existing orders with tokens
UPDATE orders 
SET 
  access_token = gen_random_uuid(),
  token_expires_at = created_at + interval '90 days'
WHERE access_token IS NULL;

-- Add RLS policy for public access with valid token
CREATE POLICY "Allow public access with valid token"
ON orders FOR SELECT
TO public
USING (access_token IS NOT NULL);

-- Add comment for documentation
COMMENT ON COLUMN orders.access_token IS 'Secure token for public access to order details without authentication';
COMMENT ON COLUMN orders.token_expires_at IS 'Expiration timestamp for access token, default 90 days from order creation';