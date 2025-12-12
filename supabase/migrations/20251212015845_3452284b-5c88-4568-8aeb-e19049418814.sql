-- Add state column to school_districts (derived from state_id)
ALTER TABLE public.school_districts ADD COLUMN IF NOT EXISTS state text;

-- Add slug columns to schools and school_districts
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.school_districts ADD COLUMN IF NOT EXISTS slug text;

-- Create unique indexes for slug lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_state_slug ON public.schools(state, slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_districts_state_slug ON public.school_districts(state, slug) WHERE slug IS NOT NULL;

-- Create landing_page_templates table
CREATE TABLE public.landing_page_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  template_type text NOT NULL CHECK (template_type IN ('school', 'district', 'nonprofit')),
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  preview_image_url text,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create landing_page_configs table (links templates to specific entities)
CREATE TABLE public.landing_page_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.landing_page_templates(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('school', 'district', 'nonprofit')),
  entity_id uuid NOT NULL,
  
  -- SEO overrides
  seo_title text,
  seo_description text,
  og_image_url text,
  
  -- Custom variable overrides (JSON object of variable_name: custom_value)
  variable_overrides jsonb DEFAULT '{}'::jsonb,
  
  -- Publishing
  is_published boolean DEFAULT false,
  published_at timestamp with time zone,
  published_by uuid REFERENCES public.profiles(id),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure one config per entity
  UNIQUE(entity_type, entity_id)
);

-- Enable RLS
ALTER TABLE public.landing_page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies for landing_page_templates
CREATE POLICY "System admins can manage templates"
ON public.landing_page_templates
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "Anyone can view templates"
ON public.landing_page_templates
FOR SELECT
USING (true);

-- RLS policies for landing_page_configs
CREATE POLICY "System admins can manage configs"
ON public.landing_page_configs
FOR ALL
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "Anyone can view published configs"
ON public.landing_page_configs
FOR SELECT
USING (is_published = true);

-- Function to generate URL-friendly slug
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(input_text), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$;

-- Update timestamps trigger
CREATE TRIGGER update_landing_page_templates_updated_at
BEFORE UPDATE ON public.landing_page_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_page_configs_updated_at
BEFORE UPDATE ON public.landing_page_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();