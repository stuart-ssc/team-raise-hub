
-- Add INSERT policy on nonprofits table for registration flow
CREATE POLICY "Authenticated users can create nonprofit details"
  ON public.nonprofits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add INSERT policy on groups table for nonprofit org setup
CREATE POLICY "Authenticated users can create groups during org setup"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
