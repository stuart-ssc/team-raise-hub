
CREATE OR REPLACE FUNCTION public.generate_group_public_slug(p_group_name text, p_organization_id uuid, p_group_id uuid DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base_slug text; existing_count integer; final_slug text;
BEGIN
  base_slug := public.generate_slug(p_group_name);
  IF base_slug IS NULL OR base_slug = '' THEN base_slug := 'group'; END IF;
  SELECT COUNT(*) INTO existing_count FROM public.groups
  WHERE organization_id = p_organization_id
    AND public_slug ~ ('^' || base_slug || '(-\d+)?$')
    AND (p_group_id IS NULL OR id <> p_group_id);
  IF existing_count = 0 THEN final_slug := base_slug;
  ELSE final_slug := base_slug || '-' || (existing_count + 1); END IF;
  RETURN final_slug;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_org_public_slug(p_org_name text, p_org_id uuid DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base_slug text; existing_count integer; final_slug text;
BEGIN
  base_slug := public.generate_slug(p_org_name);
  IF base_slug IS NULL OR base_slug = '' THEN base_slug := 'org'; END IF;
  SELECT COUNT(*) INTO existing_count FROM public.organizations
  WHERE public_slug ~ ('^' || base_slug || '(-\d+)?$')
    AND (p_org_id IS NULL OR id <> p_org_id);
  IF existing_count = 0 THEN final_slug := base_slug;
  ELSE final_slug := base_slug || '-' || (existing_count + 1); END IF;
  RETURN final_slug;
END; $$;

CREATE OR REPLACE FUNCTION public.set_group_public_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.public_slug IS NULL OR NEW.public_slug = '' THEN
    NEW.public_slug := public.generate_group_public_slug(NEW.group_name, NEW.organization_id, NEW.id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_group_public_slug ON public.groups;
CREATE TRIGGER trg_set_group_public_slug
BEFORE INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.set_group_public_slug();

CREATE OR REPLACE FUNCTION public.set_org_public_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.public_slug IS NULL OR NEW.public_slug = '' THEN
    NEW.public_slug := public.generate_org_public_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_org_public_slug ON public.organizations;
CREATE TRIGGER trg_set_org_public_slug
BEFORE INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_org_public_slug();

UPDATE public.organizations SET public_slug = public.generate_org_public_slug(name, id)
WHERE public_slug IS NULL OR public_slug = '';

UPDATE public.groups SET public_slug = public.generate_group_public_slug(group_name, organization_id, id)
WHERE public_slug IS NULL OR public_slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_org_public_slug ON public.groups (organization_id, public_slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_public_slug ON public.organizations (public_slug);
