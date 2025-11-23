-- Create custom_email_layouts table for user-created templates
CREATE TABLE IF NOT EXISTS public.custom_email_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  preview_color text DEFAULT 'bg-gradient-to-br from-gray-400 to-gray-600',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.custom_email_layouts ENABLE ROW LEVEL SECURITY;

-- Organization members can view custom layouts
CREATE POLICY "Organization members can view custom layouts"
  ON public.custom_email_layouts
  FOR SELECT
  USING (
    user_belongs_to_organization(auth.uid(), organization_id)
    OR is_system_admin(auth.uid())
  );

-- Authorized users can create custom layouts
CREATE POLICY "Authorized users can create custom layouts"
  ON public.custom_email_layouts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = custom_email_layouts.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
    OR is_system_admin(auth.uid())
  );

-- Authorized users can update custom layouts in their org
CREATE POLICY "Authorized users can update custom layouts"
  ON public.custom_email_layouts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = custom_email_layouts.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
    OR is_system_admin(auth.uid())
  );

-- Authorized users can delete custom layouts in their org
CREATE POLICY "Authorized users can delete custom layouts"
  ON public.custom_email_layouts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = custom_email_layouts.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
    OR is_system_admin(auth.uid())
  );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_custom_email_layouts_updated_at
  BEFORE UPDATE ON public.custom_email_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for organization queries
CREATE INDEX idx_custom_email_layouts_organization_id 
  ON public.custom_email_layouts(organization_id);