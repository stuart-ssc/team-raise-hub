-- 1. Add ownership column to donor_profiles
ALTER TABLE public.donor_profiles
  ADD COLUMN IF NOT EXISTS added_by_organization_user_id uuid
    REFERENCES public.organization_user(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_donor_profiles_added_by_ou
  ON public.donor_profiles(added_by_organization_user_id);

-- 2. Add ownership column to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS added_by_organization_user_id uuid
    REFERENCES public.organization_user(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_added_by_ou
  ON public.businesses(added_by_organization_user_id);

-- 3. Reassignment function (admin / program_manager only)
CREATE OR REPLACE FUNCTION public.reassign_donor_ownership(
  _donor_id uuid,
  _new_owner_org_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_donor_org_id uuid;
  v_new_owner_org_id uuid;
  v_caller_is_admin boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT organization_id INTO v_donor_org_id
  FROM donor_profiles WHERE id = _donor_id;

  IF v_donor_org_id IS NULL THEN
    RAISE EXCEPTION 'Donor not found';
  END IF;

  -- Allow NULL new owner (unassign), otherwise validate same org
  IF _new_owner_org_user_id IS NOT NULL THEN
    SELECT organization_id INTO v_new_owner_org_id
    FROM organization_user WHERE id = _new_owner_org_user_id;

    IF v_new_owner_org_id IS DISTINCT FROM v_donor_org_id THEN
      RAISE EXCEPTION 'New owner must belong to the same organization';
    END IF;
  END IF;

  -- Caller must be admin or program_manager in the donor's org
  SELECT EXISTS (
    SELECT 1
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid()
      AND ou.organization_id = v_donor_org_id
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
  ) INTO v_caller_is_admin;

  IF NOT v_caller_is_admin THEN
    RAISE EXCEPTION 'Only organization admins or program managers can reassign donor ownership';
  END IF;

  UPDATE donor_profiles
  SET added_by_organization_user_id = _new_owner_org_user_id,
      updated_at = now()
  WHERE id = _donor_id;
END;
$$;

-- 4. Backfill donor_profiles.added_by_organization_user_id from earliest attributed order
UPDATE public.donor_profiles dp
SET added_by_organization_user_id = sub.org_user_id
FROM (
  SELECT DISTINCT ON (o.customer_email, g.organization_id)
    o.customer_email,
    g.organization_id,
    o.attributed_roster_member_id AS org_user_id
  FROM orders o
  JOIN campaigns c ON c.id = o.campaign_id
  JOIN groups g    ON g.id = c.group_id
  WHERE o.attributed_roster_member_id IS NOT NULL
    AND o.customer_email IS NOT NULL
  ORDER BY o.customer_email, g.organization_id, o.created_at
) sub
WHERE lower(dp.email) = lower(sub.customer_email)
  AND dp.organization_id = sub.organization_id
  AND dp.added_by_organization_user_id IS NULL;