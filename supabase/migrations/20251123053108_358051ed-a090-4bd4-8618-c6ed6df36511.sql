-- Phase 1: Database Foundation & Migration for Sponsorly Rebrand

-- Create organization types enum
CREATE TYPE organization_type AS ENUM ('school', 'nonprofit');

-- Create school subtypes enum  
CREATE TYPE school_subtype AS ENUM ('public', 'charter', 'private');

-- Main organizations table (new hub)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_type organization_type NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  payment_processor_config JSONB DEFAULT '{"processor": "pending", "account_id": null, "account_enabled": false}'::jsonb,
  requires_verification BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending',
  verification_submitted_at TIMESTAMPTZ,
  verification_approved_at TIMESTAMPTZ,
  verification_documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Non-profits specific data
CREATE TABLE nonprofits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  ein TEXT,
  mission_statement TEXT,
  c3_status_document_url TEXT,
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nonprofits ENABLE ROW LEVEL SECURITY;

-- Add columns to existing schools table (KEEP school_id for data integrity verification)
ALTER TABLE schools 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS school_subtype school_subtype;

-- Add to groups table
ALTER TABLE groups 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS use_org_payment_account BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_processor_config JSONB DEFAULT '{"processor": "pending", "account_id": null, "account_enabled": false}'::jsonb;

-- Remove old Stripe columns from groups (if they exist)
ALTER TABLE groups 
  DROP COLUMN IF EXISTS stripe_account_id,
  DROP COLUMN IF EXISTS stripe_account_enabled;

-- Add system admin flag to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS system_admin BOOLEAN DEFAULT false;

-- Migrate existing schools to organizations
INSERT INTO organizations (
  id, 
  organization_type, 
  name, 
  city, 
  state,
  zip,
  phone,
  logo_url,
  primary_color,
  secondary_color,
  payment_processor_config,
  requires_verification,
  verification_status
)
SELECT 
  gen_random_uuid(),
  'school'::organization_type,
  school_name,
  city,
  state,
  zip,
  phone,
  logo_file,
  "Primary Color",
  "Secondary Color",
  '{"processor": "pending", "account_id": null, "account_enabled": false}'::jsonb,
  CASE 
    WHEN "Charter" = true OR school_type = 'Private' THEN true 
    ELSE false 
  END,
  'approved'
FROM schools
WHERE NOT EXISTS (
  SELECT 1 FROM organizations o 
  WHERE o.name = schools.school_name 
  AND o.city = schools.city 
  AND o.state = schools.state
);

-- Update schools table with organization_id and subtype
UPDATE schools s
SET 
  organization_id = o.id,
  school_subtype = CASE 
    WHEN s."Charter" = true THEN 'charter'::school_subtype
    WHEN s.school_type = 'Private' THEN 'private'::school_subtype
    ELSE 'public'::school_subtype
  END
FROM organizations o
WHERE o.name = s.school_name 
  AND o.city = s.city 
  AND o.state = s.state
  AND o.organization_type = 'school'
  AND s.organization_id IS NULL;

-- Migrate existing groups (KEEP school_id column)
UPDATE groups g
SET organization_id = s.organization_id
FROM schools s
WHERE g.school_id = s.id
  AND g.organization_id IS NULL;

-- Create organization_user table
CREATE TABLE organization_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id),
  user_type_id UUID NOT NULL REFERENCES user_type(id),
  roster_id BIGINT REFERENCES rosters(id),
  active_user BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id, group_id)
);

ALTER TABLE organization_user ENABLE ROW LEVEL SECURITY;

-- Migrate existing school_user data (KEEP school_user table for now)
INSERT INTO organization_user (
  id, user_id, organization_id, group_id, user_type_id, roster_id, active_user, created_at, updated_at
)
SELECT 
  su.id,
  su.user_id,
  s.organization_id,
  su.group_id,
  su.user_type_id,
  su.roster_id,
  su.active_user,
  su.created_at,
  su.updated_at
FROM school_user su
JOIN schools s ON su.school_id = s.id
WHERE s.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organization_user ou 
    WHERE ou.id = su.id
  );

-- Add permission_level column to user_type
ALTER TABLE user_type 
  ADD COLUMN IF NOT EXISTS permission_level TEXT;

-- Insert new non-profit user types
INSERT INTO user_type (name, description, permission_level) 
SELECT * FROM (VALUES
  ('Executive Director', 'Non-profit executive leadership with full organizational access', 'organization_admin'),
  ('Program Director', 'Manages specific programs or initiatives within the non-profit', 'program_manager'),
  ('Volunteer', 'Active volunteer participant in non-profit programs', 'participant'),
  ('Board Member', 'Non-profit board member with advisory role', 'supporter'),
  ('Donor', 'External supporter who makes donations', 'sponsor')
) AS new_types(name, description, permission_level)
WHERE NOT EXISTS (
  SELECT 1 FROM user_type WHERE user_type.name = new_types.name
);

-- Update existing school user types with permission levels
UPDATE user_type SET permission_level = 'organization_admin' 
WHERE name IN ('Principal', 'Athletic Director') AND permission_level IS NULL;

UPDATE user_type SET permission_level = 'program_manager'
WHERE name IN ('Coach', 'Club Sponsor', 'Booster Leader') AND permission_level IS NULL;

UPDATE user_type SET permission_level = 'participant'
WHERE name IN ('Team Player', 'Club Participant') AND permission_level IS NULL;

UPDATE user_type SET permission_level = 'supporter'
WHERE name IN ('Family Member', 'Sponsor') AND permission_level IS NULL;

-- System admin check function
CREATE OR REPLACE FUNCTION is_system_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND system_admin = true
  );
$$;

-- User belongs to organization function
CREATE OR REPLACE FUNCTION user_belongs_to_organization(user_id UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_user 
    WHERE organization_user.user_id = user_id 
    AND organization_user.organization_id = org_id
  );
$$;

-- Check if user can update organization_user
CREATE OR REPLACE FUNCTION can_update_organization_user(target_org_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_user ou1
    JOIN user_type ut ON (ou1.user_type_id = ut.id)
    JOIN organization_user ou2 ON (ou1.organization_id = ou2.organization_id)
    WHERE ou1.user_id = auth.uid() 
      AND ou2.id = target_org_user_id
      AND ut.permission_level IN ('organization_admin', 'program_manager')
  );
$$;

-- RLS policies for organization_user
CREATE POLICY "Users can view organization_user records in their org"
ON organization_user FOR SELECT
TO authenticated
USING (user_belongs_to_organization(auth.uid(), organization_id));

CREATE POLICY "Users can create their own organization_user record"
ON organization_user FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update organization_user records in their org"
ON organization_user FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR can_update_organization_user(id));

CREATE POLICY "System admins have full access to organization_user"
ON organization_user FOR ALL
TO authenticated
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- RLS policies for organizations
CREATE POLICY "Organizations are publicly readable"
ON organizations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Organization admins can update their org"
ON organizations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id = organizations.id
    AND ut.permission_level = 'organization_admin'
  )
  OR is_system_admin(auth.uid())
);

CREATE POLICY "System admins can manage all organizations"
ON organizations FOR ALL
TO authenticated
USING (is_system_admin(auth.uid()))
WITH CHECK (is_system_admin(auth.uid()));

-- RLS policies for nonprofits
CREATE POLICY "Nonprofit details viewable by org members"
ON nonprofits FOR SELECT
TO authenticated
USING (
  user_belongs_to_organization(auth.uid(), organization_id)
  OR is_system_admin(auth.uid())
);

CREATE POLICY "Organization admins can update nonprofit details"
ON nonprofits FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id = nonprofits.organization_id
    AND ut.permission_level = 'organization_admin'
  )
  OR is_system_admin(auth.uid())
);

-- Storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Update orders table to be processor-agnostic
ALTER TABLE orders
  DROP COLUMN IF EXISTS stripe_session_id,
  DROP COLUMN IF EXISTS stripe_payment_intent_id,
  ADD COLUMN IF NOT EXISTS payment_processor TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processor_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS processor_session_id TEXT,
  ADD COLUMN IF NOT EXISTS tax_receipt_issued BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_receipt_sent_at TIMESTAMPTZ;

-- Add publication_status to campaigns
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS publication_status TEXT DEFAULT 'draft';

-- Campaign publish eligibility check
CREATE OR REPLACE FUNCTION check_campaign_publish_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  org_verified BOOLEAN;
  payment_configured BOOLEAN;
BEGIN
  IF NEW.publication_status = 'published' THEN
    SELECT 
      CASE 
        WHEN o.requires_verification = true AND o.verification_status != 'approved' 
        THEN false 
        ELSE true 
      END INTO org_verified
    FROM organizations o
    JOIN groups g ON o.id = g.organization_id
    WHERE g.id = NEW.group_id;
    
    IF NOT org_verified THEN
      RAISE EXCEPTION 'Organization must be verified before publishing campaigns';
    END IF;
    
    SELECT EXISTS (
      SELECT 1 FROM groups g
      LEFT JOIN organizations o ON g.organization_id = o.id
      WHERE g.id = NEW.group_id
      AND (
        (g.payment_processor_config->>'account_enabled')::boolean = true
        OR (
          g.use_org_payment_account = true
          AND (o.payment_processor_config->>'account_enabled')::boolean = true
        )
      )
    ) INTO payment_configured;
    
    IF NOT payment_configured THEN
      RAISE EXCEPTION 'Payment account must be configured before publishing campaigns';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_campaign_publish_rules ON campaigns;
CREATE TRIGGER enforce_campaign_publish_rules
BEFORE INSERT OR UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION check_campaign_publish_eligibility();

-- Update campaigns RLS policies to use organization_user
DROP POLICY IF EXISTS "Users with qualifying roles can view campaigns at their school" ON campaigns;

CREATE POLICY "Users with qualifying roles can view campaigns at their org"
ON campaigns FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN groups g ON campaigns.group_id = g.id
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id = g.organization_id
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR is_system_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users with qualifying roles can create campaigns at their school" ON campaigns;

CREATE POLICY "Users with qualifying roles can create campaigns at their org"
ON campaigns FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN groups g ON campaigns.group_id = g.id
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id = g.organization_id
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
);

DROP POLICY IF EXISTS "Users with qualifying roles can update campaigns at their school" ON campaigns;

CREATE POLICY "Users with qualifying roles can update campaigns at their org"
ON campaigns FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    JOIN groups g ON campaigns.group_id = g.id
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id = g.organization_id
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
  OR is_system_admin(auth.uid())
);