-- Create security definer function to check if user can view a business
CREATE OR REPLACE FUNCTION public.user_can_view_business(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- System admins can view all businesses
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = _user_id AND system_admin = true
  )
  OR
  -- Users can view businesses if their organization has a relationship
  EXISTS (
    SELECT 1
    FROM organization_user ou
    WHERE ou.user_id = _user_id
    AND ou.active_user = true
    AND (
      -- Via organization_businesses table
      EXISTS (
        SELECT 1 FROM organization_businesses ob
        WHERE ob.business_id = _business_id
        AND ob.organization_id = ou.organization_id
      )
      OR
      -- Via business_donors table (organization relationship)
      EXISTS (
        SELECT 1 FROM business_donors bd
        WHERE bd.business_id = _business_id
        AND bd.organization_id = ou.organization_id
        AND bd.blocked_at IS NULL
      )
    )
  );
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Businesses are viewable by authenticated users" ON public.businesses;

-- Create restrictive policy for viewing businesses
CREATE POLICY "Users can view businesses in their organization" 
ON public.businesses 
FOR SELECT 
TO authenticated
USING (public.user_can_view_business(auth.uid(), id));