-- Recreate the view with security_invoker = true
DROP VIEW IF EXISTS public.organizations_public;

CREATE VIEW public.organizations_public
WITH (security_invoker = true)
AS
SELECT 
    id,
    organization_type,
    name,
    city,
    state,
    logo_url,
    website_url
FROM organizations;

-- Re-grant permissions
GRANT SELECT ON public.organizations_public TO anon, authenticated;