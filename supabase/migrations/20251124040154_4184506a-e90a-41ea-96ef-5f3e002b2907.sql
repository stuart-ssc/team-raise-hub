-- Create businesses table (global business records)
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  ein TEXT,
  business_email TEXT,
  business_phone TEXT,
  website_url TEXT,
  industry TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  logo_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'submitted')),
  verification_submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ein)
);

CREATE INDEX idx_businesses_ein ON businesses(ein);
CREATE INDEX idx_businesses_name ON businesses(business_name);

-- Create organization_businesses table (org-specific business data)
CREATE TABLE organization_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  notes TEXT,
  custom_data JSONB DEFAULT '{}',
  relationship_status TEXT DEFAULT 'active' CHECK (relationship_status IN ('active', 'inactive', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, business_id)
);

CREATE INDEX idx_org_businesses_org ON organization_businesses(organization_id);
CREATE INDEX idx_org_businesses_business ON organization_businesses(business_id);

-- Create business_donors table (many-to-many: businesses <-> donors)
CREATE TABLE business_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT,
  is_primary_contact BOOLEAN DEFAULT FALSE,
  auto_linked BOOLEAN DEFAULT FALSE,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_by UUID,
  blocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, donor_id, organization_id)
);

CREATE INDEX idx_business_donors_business ON business_donors(business_id);
CREATE INDEX idx_business_donors_donor ON business_donors(donor_id);
CREATE INDEX idx_business_donors_org ON business_donors(organization_id);

-- Create campaign_custom_fields table
CREATE TABLE campaign_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'date', 'url', 'email', 'phone', 'file', 'checkbox', 'select')),
  field_options JSONB,
  is_required BOOLEAN DEFAULT FALSE,
  help_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_fields_campaign ON campaign_custom_fields(campaign_id);

-- Create order_custom_field_values table
CREATE TABLE order_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES campaign_custom_fields(id) ON DELETE CASCADE,
  field_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_field_values_order ON order_custom_field_values(order_id);

-- Create sponsorship_files table
CREATE TABLE sponsorship_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_url TEXT,
  mime_type TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  custom_field_id UUID REFERENCES campaign_custom_fields(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sponsorship_files_order ON sponsorship_files(order_id);

-- Create business_update_notifications table
CREATE TABLE business_update_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL,
  changes JSONB NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_updates_business ON business_update_notifications(business_id);
CREATE INDEX idx_business_updates_sent ON business_update_notifications(notification_sent);

-- Create file_upload_reminders table
CREATE TABLE file_upload_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  deadline_date DATE NOT NULL,
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  files_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_reminders_order ON file_upload_reminders(order_id);
CREATE INDEX idx_file_reminders_deadline ON file_upload_reminders(deadline_date);

-- Update campaigns table
ALTER TABLE campaigns ADD COLUMN requires_business_info BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN file_upload_deadline_days INTEGER;

-- Update orders table
ALTER TABLE orders ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE orders ADD COLUMN business_purchase BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN files_complete BOOLEAN DEFAULT FALSE;

-- Update notifications table
ALTER TABLE notifications ADD COLUMN business_id UUID REFERENCES businesses(id);
ALTER TABLE notifications ADD COLUMN order_id UUID REFERENCES orders(id);
ALTER TABLE notifications ADD COLUMN action_url TEXT;

-- Enable RLS on all new tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_update_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_upload_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Businesses are viewable by authenticated users"
ON businesses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Linked donors can update businesses"
ON businesses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business_donors bd
    WHERE bd.business_id = businesses.id
    AND bd.donor_id = auth.uid()
    AND bd.blocked_at IS NULL
  )
);

CREATE POLICY "System can create businesses"
ON businesses FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for organization_businesses
CREATE POLICY "Org members can view org businesses"
ON organization_businesses FOR SELECT
TO authenticated
USING (user_belongs_to_organization(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

CREATE POLICY "Admins can manage org business data"
ON organization_businesses FOR ALL
TO authenticated
USING (
  (user_belongs_to_organization(auth.uid(), organization_id) AND
   EXISTS (
     SELECT 1 FROM organization_user ou
     JOIN user_type ut ON ou.user_type_id = ut.id
     WHERE ou.user_id = auth.uid()
     AND ou.organization_id = organization_businesses.organization_id
     AND ut.permission_level IN ('organization_admin', 'program_manager')
   )) OR is_system_admin(auth.uid())
);

-- RLS Policies for business_donors
CREATE POLICY "Donors can view their business links"
ON business_donors FOR SELECT
TO authenticated
USING (
  donor_id = auth.uid() OR
  user_belongs_to_organization(auth.uid(), organization_id) OR
  is_system_admin(auth.uid())
);

CREATE POLICY "Org users can manage business donors"
ON business_donors FOR ALL
TO authenticated
USING (user_belongs_to_organization(auth.uid(), organization_id) OR is_system_admin(auth.uid()));

-- RLS Policies for campaign_custom_fields
CREATE POLICY "Custom fields viewable for campaigns"
ON campaign_custom_fields FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = campaign_custom_fields.campaign_id
  )
);

CREATE POLICY "Admins can manage custom fields"
ON campaign_custom_fields FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    JOIN groups g ON c.group_id = g.id
    WHERE c.id = campaign_custom_fields.campaign_id
    AND user_belongs_to_organization(auth.uid(), g.organization_id)
    AND EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = g.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
  ) OR is_system_admin(auth.uid())
);

-- RLS Policies for order_custom_field_values
CREATE POLICY "Donors manage their order field values"
ON order_custom_field_values FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_custom_field_values.order_id
    AND orders.user_id = auth.uid()
  ) OR is_system_admin(auth.uid())
);

CREATE POLICY "Org members view order field values"
ON order_custom_field_values FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN campaigns c ON o.campaign_id = c.id
    JOIN groups g ON c.group_id = g.id
    WHERE o.id = order_custom_field_values.order_id
    AND user_belongs_to_organization(auth.uid(), g.organization_id)
  ) OR is_system_admin(auth.uid())
);

-- RLS Policies for sponsorship_files
CREATE POLICY "Donors can manage their sponsorship files"
ON sponsorship_files FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = sponsorship_files.order_id
    AND orders.user_id = auth.uid()
  ) OR is_system_admin(auth.uid())
);

CREATE POLICY "Org admins can view sponsorship files"
ON sponsorship_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN campaigns c ON o.campaign_id = c.id
    JOIN groups g ON c.group_id = g.id
    WHERE o.id = sponsorship_files.order_id
    AND user_belongs_to_organization(auth.uid(), g.organization_id)
    AND EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = g.organization_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
    )
  ) OR is_system_admin(auth.uid())
);

-- RLS Policies for business_update_notifications
CREATE POLICY "System can manage business update notifications"
ON business_update_notifications FOR ALL
TO authenticated
USING (is_system_admin(auth.uid()));

-- RLS Policies for file_upload_reminders
CREATE POLICY "System can manage file upload reminders"
ON file_upload_reminders FOR ALL
TO authenticated
USING (is_system_admin(auth.uid()));

CREATE POLICY "Donors can view their file upload reminders"
ON file_upload_reminders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = file_upload_reminders.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Create storage bucket for sponsorship files
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsorship-files', 'sponsorship-files', false)
ON CONFLICT (id) DO NOTHING;

-- Trigger to update businesses.updated_at
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION update_businesses_updated_at();

-- Trigger to log business updates
CREATE OR REPLACE FUNCTION log_business_update()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '[]'::jsonb;
BEGIN
  IF OLD.business_name IS DISTINCT FROM NEW.business_name THEN
    changes := changes || jsonb_build_object('field', 'business_name', 'old', OLD.business_name, 'new', NEW.business_name);
  END IF;
  IF OLD.business_email IS DISTINCT FROM NEW.business_email THEN
    changes := changes || jsonb_build_object('field', 'business_email', 'old', OLD.business_email, 'new', NEW.business_email);
  END IF;
  IF OLD.business_phone IS DISTINCT FROM NEW.business_phone THEN
    changes := changes || jsonb_build_object('field', 'business_phone', 'old', OLD.business_phone, 'new', NEW.business_phone);
  END IF;
  IF OLD.website_url IS DISTINCT FROM NEW.website_url THEN
    changes := changes || jsonb_build_object('field', 'website_url', 'old', OLD.website_url, 'new', NEW.website_url);
  END IF;
  IF OLD.address_line1 IS DISTINCT FROM NEW.address_line1 THEN
    changes := changes || jsonb_build_object('field', 'address_line1', 'old', OLD.address_line1, 'new', NEW.address_line1);
  END IF;
  
  IF jsonb_array_length(changes) > 0 THEN
    INSERT INTO business_update_notifications (business_id, updated_by, changes)
    VALUES (NEW.id, auth.uid(), changes);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_business_updates
AFTER UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION log_business_update();