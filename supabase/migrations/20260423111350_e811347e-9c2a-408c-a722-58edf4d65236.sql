
-- ============================================================
-- Participant business ownership + archive-only model
-- ============================================================
-- 1) Allow participants (any active org user) to INSERT a business
--    they own (added_by_organization_user_id = their org_user.id)
-- 2) Allow business owners (participants) to UPDATE their own
--    businesses (covers archive/restore via archived_at toggle)
-- 3) Allow active org users to INSERT into organization_businesses
--    so they can link businesses they create to their org
-- 4) Allow active org users to manage business_donors for businesses
--    they own (so they can link/unlink employee donors)
-- 5) Backfill businesses.added_by_organization_user_id from earliest
--    attributed order's roster member
-- 6) Reassignment function for org admins
-- 7) Ensure NO DELETE policies exist on businesses (archive only)
-- ============================================================

-- 1. INSERT policy on businesses for any active org user
--    (must own the new business via added_by_organization_user_id)
DROP POLICY IF EXISTS "Active users can create businesses they own" ON public.businesses;
CREATE POLICY "Active users can create businesses they own"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (
  added_by_organization_user_id IN (
    SELECT id FROM public.organization_user
    WHERE user_id = auth.uid() AND active_user = true
  )
  OR is_system_admin(auth.uid())
);

-- 2. UPDATE policy on businesses for owners (participants editing/archiving their own)
DROP POLICY IF EXISTS "Business owners can update their businesses" ON public.businesses;
CREATE POLICY "Business owners can update their businesses"
ON public.businesses
FOR UPDATE
TO authenticated
USING (
  added_by_organization_user_id IN (
    SELECT id FROM public.organization_user
    WHERE user_id = auth.uid() AND active_user = true
  )
)
WITH CHECK (
  added_by_organization_user_id IN (
    SELECT id FROM public.organization_user
    WHERE user_id = auth.uid() AND active_user = true
  )
);

-- 3. INSERT policy on organization_businesses so participants can link
--    a new business to their organization
DROP POLICY IF EXISTS "Active users can link businesses to their org" ON public.organization_businesses;
CREATE POLICY "Active users can link businesses to their org"
ON public.organization_businesses
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_user
    WHERE user_id = auth.uid() AND active_user = true
  )
  OR is_system_admin(auth.uid())
);

-- 4. business_donors: allow owners to manage employee links on their businesses
DROP POLICY IF EXISTS "Business owners can manage their business donors" ON public.business_donors;
CREATE POLICY "Business owners can manage their business donors"
ON public.business_donors
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_donors.business_id
      AND b.added_by_organization_user_id IN (
        SELECT id FROM public.organization_user
        WHERE user_id = auth.uid() AND active_user = true
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_donors.business_id
      AND b.added_by_organization_user_id IN (
        SELECT id FROM public.organization_user
        WHERE user_id = auth.uid() AND active_user = true
      )
  )
);

-- 5. Backfill: populate added_by_organization_user_id from earliest
--    attributed order where the business was first associated.
UPDATE public.businesses b
SET added_by_organization_user_id = sub.org_user_id
FROM (
  SELECT DISTINCT ON (o.business_id)
    o.business_id,
    o.attributed_roster_member_id AS org_user_id
  FROM public.orders o
  WHERE o.business_id IS NOT NULL
    AND o.attributed_roster_member_id IS NOT NULL
  ORDER BY o.business_id, o.created_at ASC
) sub
WHERE b.id = sub.business_id
  AND b.added_by_organization_user_id IS NULL;

-- 6. Reassignment function (org admins / program managers / system admins)
CREATE OR REPLACE FUNCTION public.reassign_business_ownership(
  _business_id uuid,
  _new_owner_org_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_authorized boolean;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- System admin OR org admin/program manager in the same org as the new owner
  SELECT
    is_system_admin(v_caller)
    OR EXISTS (
      SELECT 1
      FROM public.organization_user ou_caller
      JOIN public.user_type ut ON ut.id = ou_caller.user_type_id
      JOIN public.organization_user ou_new ON ou_new.organization_id = ou_caller.organization_id
      WHERE ou_caller.user_id = v_caller
        AND ou_caller.active_user = true
        AND ut.permission_level IN ('organization_admin', 'program_manager')
        AND ou_new.id = _new_owner_org_user_id
    )
  INTO v_authorized;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized to reassign business ownership';
  END IF;

  UPDATE public.businesses
  SET added_by_organization_user_id = _new_owner_org_user_id,
      updated_at = now()
  WHERE id = _business_id;
END;
$$;

-- 7. Ensure NO DELETE policy exists on businesses (archive-only model)
--    Drop any pre-existing DELETE policies if they exist.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname
    FROM pg_policy
    WHERE polrelid = 'public.businesses'::regclass
      AND polcmd = 'd'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.businesses', pol.polname);
  END LOOP;
END $$;
