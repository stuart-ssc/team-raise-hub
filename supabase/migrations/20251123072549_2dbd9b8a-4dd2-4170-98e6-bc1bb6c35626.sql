-- Create table for custom email layout versions
CREATE TABLE IF NOT EXISTS public.custom_email_layout_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES public.custom_email_layouts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  preview_color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  change_description TEXT,
  CONSTRAINT unique_layout_version UNIQUE(layout_id, version_number)
);

-- Enable RLS
ALTER TABLE public.custom_email_layout_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_email_layout_versions
CREATE POLICY "Users can view versions from their organization"
  ON public.custom_email_layout_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_email_layouts cel
      JOIN public.organization_user ou ON cel.organization_id = ou.organization_id
      WHERE cel.id = custom_email_layout_versions.layout_id
      AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins and program managers can create versions"
  ON public.custom_email_layout_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.custom_email_layouts cel
      JOIN public.organization_user ou ON cel.organization_id = ou.organization_id
      JOIN public.user_type ut ON ou.user_type_id = ut.id
      WHERE cel.id = layout_id
      AND ou.user_id = auth.uid()
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
  );

-- Create index for faster queries
CREATE INDEX idx_layout_versions_layout_id ON public.custom_email_layout_versions(layout_id);
CREATE INDEX idx_layout_versions_created_at ON public.custom_email_layout_versions(created_at DESC);

-- Function to save version before update
CREATE OR REPLACE FUNCTION public.save_email_layout_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.custom_email_layout_versions
  WHERE layout_id = OLD.id;
  
  -- Save current state as a version before updating
  INSERT INTO public.custom_email_layout_versions (
    layout_id,
    version_number,
    name,
    description,
    blocks,
    preview_color,
    created_by,
    change_description
  )
  VALUES (
    OLD.id,
    next_version,
    OLD.name,
    OLD.description,
    OLD.blocks,
    OLD.preview_color,
    auth.uid(),
    'Auto-saved version before update'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-save versions on update
CREATE TRIGGER save_version_before_update
  BEFORE UPDATE ON public.custom_email_layouts
  FOR EACH ROW
  WHEN (OLD.blocks IS DISTINCT FROM NEW.blocks OR OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION public.save_email_layout_version();

-- Function to restore a specific version
CREATE OR REPLACE FUNCTION public.restore_email_layout_version(
  p_layout_id UUID,
  p_version_number INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_version RECORD;
BEGIN
  -- Get the version to restore
  SELECT * INTO v_version
  FROM public.custom_email_layout_versions
  WHERE layout_id = p_layout_id
  AND version_number = p_version_number;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found';
  END IF;
  
  -- Update the main layout with version data
  UPDATE public.custom_email_layouts
  SET
    name = v_version.name,
    description = v_version.description,
    blocks = v_version.blocks,
    preview_color = v_version.preview_color,
    updated_at = now()
  WHERE id = p_layout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;