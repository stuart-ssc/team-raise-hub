CREATE POLICY "Participants can view their attributed orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_user ou
    WHERE ou.user_id = auth.uid()
      AND ou.active_user = true
      AND (
        ou.id = orders.attributed_roster_member_id
        OR ou.linked_organization_user_id = orders.attributed_roster_member_id
      )
  )
);