-- Fix the 'Allow public access with valid token' policy to validate token expiration
-- This ensures expired access tokens cannot be used to access order data

-- First, drop the existing policy
DROP POLICY IF EXISTS "Allow public access with valid token" ON public.orders;

-- Recreate the policy with token expiration validation
CREATE POLICY "Allow public access with valid token" ON public.orders
  FOR SELECT
  USING (
    access_token IS NOT NULL 
    AND (token_expires_at IS NULL OR token_expires_at > NOW())
  );