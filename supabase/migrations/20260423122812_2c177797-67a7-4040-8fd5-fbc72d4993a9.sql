-- Trigger to lock down editable columns on verified businesses for non-system-admins
CREATE OR REPLACE FUNCTION public.enforce_verified_business_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce when the (existing) row is verified
  IF OLD.verification_status IS DISTINCT FROM 'verified' THEN
    RETURN NEW;
  END IF;

  -- System admins bypass entirely
  IF auth.uid() IS NOT NULL AND public.is_system_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- For non-system-admins, prevent edits to locked columns
  IF OLD.business_name        IS DISTINCT FROM NEW.business_name
  OR OLD.business_email       IS DISTINCT FROM NEW.business_email
  OR OLD.business_phone       IS DISTINCT FROM NEW.business_phone
  OR OLD.website_url          IS DISTINCT FROM NEW.website_url
  OR OLD.ein                  IS DISTINCT FROM NEW.ein
  OR OLD.industry             IS DISTINCT FROM NEW.industry
  OR OLD.address_line1        IS DISTINCT FROM NEW.address_line1
  OR OLD.address_line2        IS DISTINCT FROM NEW.address_line2
  OR OLD.city                 IS DISTINCT FROM NEW.city
  OR OLD.state                IS DISTINCT FROM NEW.state
  OR OLD.zip                  IS DISTINCT FROM NEW.zip
  OR OLD.country              IS DISTINCT FROM NEW.country
  OR OLD.logo_url             IS DISTINCT FROM NEW.logo_url
  OR OLD.verification_status  IS DISTINCT FROM NEW.verification_status
  THEN
    RAISE EXCEPTION 'This business is verified. Core details can only be changed by the business owner or a system administrator.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_verified_business_immutable_trigger ON public.businesses;
CREATE TRIGGER enforce_verified_business_immutable_trigger
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_verified_business_immutable();

-- RLS UPDATE policy on business_donors so org admins/managers and participant
-- owners can flip the disengage (blocked_at) flag.
DROP POLICY IF EXISTS "Org members can disengage business contacts" ON public.business_donors;
CREATE POLICY "Org members can disengage business contacts"
ON public.business_donors
FOR UPDATE
TO authenticated
USING (
  public.is_system_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid()
      AND ou.organization_id = business_donors.organization_id
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR EXISTS (
    SELECT 1
    FROM businesses b
    JOIN organization_user ou ON ou.id = b.added_by_organization_user_id
    WHERE b.id = business_donors.business_id
      AND ou.user_id = auth.uid()
      AND ou.active_user = true
  )
)
WITH CHECK (
  public.is_system_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid()
      AND ou.organization_id = business_donors.organization_id
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR EXISTS (
    SELECT 1
    FROM businesses b
    JOIN organization_user ou ON ou.id = b.added_by_organization_user_id
    WHERE b.id = business_donors.business_id
      AND ou.user_id = auth.uid()
      AND ou.active_user = true
  )
);