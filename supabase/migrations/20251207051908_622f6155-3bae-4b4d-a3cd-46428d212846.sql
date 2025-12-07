-- Create a public view with only non-sensitive organization fields
CREATE OR REPLACE VIEW public.organizations_public AS
SELECT 
  id,
  organization_type,
  name,
  city,
  state,
  logo_url,
  website_url
FROM public.organizations;

-- Grant public access to the view
GRANT SELECT ON public.organizations_public TO anon;
GRANT SELECT ON public.organizations_public TO authenticated;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Organizations are publicly readable" ON public.organizations;

-- Create a new policy that only allows authenticated organization members to view full details
CREATE POLICY "Organization members can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_user ou
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id = organizations.id
  )
  OR is_system_admin(auth.uid())
);