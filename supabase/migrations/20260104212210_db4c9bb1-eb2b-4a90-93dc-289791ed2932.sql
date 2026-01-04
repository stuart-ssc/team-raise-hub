-- Fix RLS policy on business_donors table
-- The current policy incorrectly compares donor_id (which is donor_profiles.id) to auth.uid()
-- It should check if the authenticated user owns the donor profile

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "Donors can view their business links" ON business_donors;

-- Create the corrected policy that properly joins through donor_profiles
CREATE POLICY "Donors can view their business links" ON business_donors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM donor_profiles dp 
    WHERE dp.id = business_donors.donor_id 
    AND dp.user_id = auth.uid()
  )
  OR user_belongs_to_organization(auth.uid(), organization_id)
  OR is_system_admin(auth.uid())
);