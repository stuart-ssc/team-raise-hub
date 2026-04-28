
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS public_page_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS public_contact_email text;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS public_page_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS public_contact_email text;

DROP POLICY IF EXISTS "Public hub readable when enabled" ON public.organizations;
CREATE POLICY "Public hub readable when enabled" ON public.organizations
FOR SELECT TO anon, authenticated USING (public_page_enabled = true);
