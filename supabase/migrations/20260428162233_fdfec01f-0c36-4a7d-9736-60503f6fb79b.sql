-- Clean organization slugs for the 4 active orgs
UPDATE public.organizations SET public_slug = 'sample-school'           WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public.organizations SET public_slug = 'helpful-house'           WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE public.organizations SET public_slug = 'tates-creek-high-school' WHERE id = '91b5cf9e-0d60-40f8-ac9a-e23778e0b82d';
UPDATE public.organizations SET public_slug = 'redline-hope'            WHERE id = 'ee0aaf76-fb85-43a3-9773-50e1e164569d';

-- Regenerate clean group slugs for groups belonging to active orgs.
-- Set-based: assign in deterministic order; collisions within an org get -2, -3, etc.
WITH ranked AS (
  SELECT
    g.id,
    g.organization_id,
    public.generate_slug(g.group_name) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY g.organization_id, public.generate_slug(g.group_name)
      ORDER BY g.created_at NULLS LAST, g.id
    ) AS rn
  FROM public.groups g
  WHERE EXISTS (
    SELECT 1 FROM public.organization_user ou
    WHERE ou.organization_id = g.organization_id
  )
)
UPDATE public.groups g
SET public_slug = CASE
  WHEN ranked.base_slug IS NULL OR ranked.base_slug = ''
    THEN 'group-' || substring(g.id::text, 1, 8)
  WHEN ranked.rn = 1 THEN ranked.base_slug
  ELSE ranked.base_slug || '-' || ranked.rn
END
FROM ranked
WHERE g.id = ranked.id;