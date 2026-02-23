
-- Safety net: explicitly grant EXECUTE to authenticated role
GRANT EXECUTE ON FUNCTION public.register_nonprofit TO authenticated;

-- Clean up any orphaned organizations (orgs with no linked users)
DELETE FROM public.organizations
WHERE id IN (
  SELECT o.id FROM public.organizations o
  LEFT JOIN public.organization_user ou ON o.id = ou.organization_id
  WHERE ou.id IS NULL
  AND o.organization_type = 'nonprofit'
);
