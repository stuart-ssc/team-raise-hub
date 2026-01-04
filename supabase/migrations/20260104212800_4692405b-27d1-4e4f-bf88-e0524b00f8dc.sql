-- Fix RLS for businesses table - allow donors to view and update their linked businesses

-- 1. Update the user_can_view_business() function to include donors
CREATE OR REPLACE FUNCTION public.user_can_view_business(_user_id uuid, _business_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  -- System admins can view all businesses
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = _user_id AND system_admin = true
  )
  OR
  -- Donors can view businesses they are linked to
  EXISTS (
    SELECT 1
    FROM business_donors bd
    JOIN donor_profiles dp ON dp.id = bd.donor_id
    WHERE bd.business_id = _business_id
    AND dp.user_id = _user_id
    AND bd.blocked_at IS NULL
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

-- 2. Fix the UPDATE policy on businesses table
DROP POLICY IF EXISTS "Linked donors can update businesses" ON businesses;

CREATE POLICY "Linked donors can update businesses" ON businesses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business_donors bd
    JOIN donor_profiles dp ON dp.id = bd.donor_id
    WHERE bd.business_id = businesses.id
    AND dp.user_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
);