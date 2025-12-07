-- Fix: Drop the SECURITY DEFINER view and recreate as regular view
DROP VIEW IF EXISTS public.organizations_public;

-- Create the view as a regular view (not security definer)
-- This view inherits the permissions of the querying user
CREATE VIEW public.organizations_public AS
SELECT 
  id,
  organization_type,
  name,
  city,
  state,
  logo_url,
  website_url
FROM public.organizations;

-- Grant access to the view
GRANT SELECT ON public.organizations_public TO anon;
GRANT SELECT ON public.organizations_public TO authenticated;