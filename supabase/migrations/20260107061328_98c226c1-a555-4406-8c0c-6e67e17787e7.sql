-- Add RLS policy to allow donors to view profiles of group leaders for campaigns they purchased from
CREATE POLICY "Donors can view profiles of campaign group leaders"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_user ou
    WHERE ou.user_id = profiles.id
      AND ou.active_user = true
      AND public.has_purchased_from_group(auth.uid(), ou.group_id)
  )
);