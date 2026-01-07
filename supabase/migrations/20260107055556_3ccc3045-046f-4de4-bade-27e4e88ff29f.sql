-- Drop the overly permissive policy that exposes all organization data publicly
-- The organizations_public view already provides the limited public access needed
DROP POLICY IF EXISTS "Anyone can view basic organization info" ON public.organizations;