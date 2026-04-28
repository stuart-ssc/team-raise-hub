-- Align groups UPDATE policy with the organization_user authorization model.
-- Previously, only users present in the legacy school_user table could update
-- groups, which blocked coaches/admins managed via organization_user.

DROP POLICY IF EXISTS "Org members can update groups in their organization"
  ON public.groups;

CREATE POLICY "Org members can update groups in their organization"
ON public.groups
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_user ou
    JOIN public.user_type ut ON ut.id = ou.user_type_id
    WHERE ou.user_id = auth.uid()
      AND ou.organization_id = groups.organization_id
      AND ou.active_user = true
      AND (
        ut.permission_level = 'organization_admin'
        OR (
          ut.permission_level = 'program_manager'
          AND (ou.group_id IS NULL OR ou.group_id = groups.id)
        )
      )
  )
  OR public.is_system_admin(auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.organization_user ou
    JOIN public.user_type ut ON ut.id = ou.user_type_id
    WHERE ou.user_id = auth.uid()
      AND ou.organization_id = groups.organization_id
      AND ou.active_user = true
      AND (
        ut.permission_level = 'organization_admin'
        OR (
          ut.permission_level = 'program_manager'
          AND (ou.group_id IS NULL OR ou.group_id = groups.id)
        )
      )
  )
  OR public.is_system_admin(auth.uid())
);
