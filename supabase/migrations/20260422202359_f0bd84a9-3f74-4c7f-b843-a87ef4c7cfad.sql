CREATE POLICY "Donor owners can update their donors"
ON public.donor_profiles
FOR UPDATE
TO authenticated
USING (
  added_by_organization_user_id IN (
    SELECT id FROM public.organization_user
    WHERE user_id = auth.uid()
      AND organization_id = donor_profiles.organization_id
      AND active_user = true
  )
)
WITH CHECK (
  added_by_organization_user_id IN (
    SELECT id FROM public.organization_user
    WHERE user_id = auth.uid()
      AND organization_id = donor_profiles.organization_id
      AND active_user = true
  )
);