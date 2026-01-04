-- Table to store message templates (quick replies)
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_shared BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Organization members can view templates in their org
CREATE POLICY "Organization members can view templates"
  ON message_templates FOR SELECT
  USING (user_belongs_to_organization(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

-- Authorized users can create templates
CREATE POLICY "Authorized users can create templates"
  ON message_templates FOR INSERT
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = message_templates.organization_id
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )) OR is_system_admin(auth.uid())
  );

-- Authorized users can update templates
CREATE POLICY "Authorized users can update templates"
  ON message_templates FOR UPDATE
  USING (
    (EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = message_templates.organization_id
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )) OR is_system_admin(auth.uid())
  );

-- Authorized users can delete templates
CREATE POLICY "Authorized users can delete templates"
  ON message_templates FOR DELETE
  USING (
    (EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = message_templates.organization_id
      AND ou.active_user = true
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )) OR is_system_admin(auth.uid())
  );

-- Index for faster lookups
CREATE INDEX idx_message_templates_org ON message_templates(organization_id);
CREATE INDEX idx_message_templates_category ON message_templates(organization_id, category);