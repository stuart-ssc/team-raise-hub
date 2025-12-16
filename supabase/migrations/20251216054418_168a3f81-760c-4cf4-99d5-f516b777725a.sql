-- Allow anyone to read basic organization info
-- Needed for checkout success page, campaign landing pages, etc.
CREATE POLICY "Anyone can view basic organization info"
ON public.organizations
FOR SELECT
TO public
USING (true);