-- Create membership_requests table
CREATE TABLE public.membership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  user_type_id UUID REFERENCES user_type(id) ON DELETE RESTRICT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requester_message TEXT,
  reviewer_id UUID,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Prevent duplicate pending requests per user per organization
CREATE UNIQUE INDEX idx_unique_pending_request 
ON membership_requests (user_id, organization_id) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON membership_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Org admins can view requests for their organization
CREATE POLICY "Org admins can view org requests"
  ON membership_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.organization_id = membership_requests.organization_id
      AND ou.user_id = auth.uid()
      AND ut.permission_level IN ('organization_admin', 'program_manager')
      AND ou.active_user = true
    )
    OR is_system_admin(auth.uid())
  );

-- Users can insert their own requests
CREATE POLICY "Users can create own requests"
  ON membership_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Org admins can update requests (approve/reject)
CREATE POLICY "Org admins can update requests"
  ON membership_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_user ou
      JOIN user_type ut ON ou.user_type_id = ut.id
      WHERE ou.organization_id = membership_requests.organization_id
      AND ou.user_id = auth.uid()
      AND ut.permission_level IN ('organization_admin', 'program_manager')
      AND ou.active_user = true
    )
    OR is_system_admin(auth.uid())
  );

-- Users can delete their own pending requests (cancel)
CREATE POLICY "Users can cancel own pending requests"
  ON membership_requests FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Trigger function to handle approval
CREATE OR REPLACE FUNCTION handle_membership_request_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Create the organization_user record
    INSERT INTO organization_user (
      user_id, 
      organization_id, 
      group_id, 
      user_type_id, 
      active_user
    )
    VALUES (
      NEW.user_id,
      NEW.organization_id,
      NEW.group_id,
      NEW.user_type_id,
      true
    )
    ON CONFLICT DO NOTHING;
    
    -- Set reviewer info
    NEW.reviewer_id := auth.uid();
    NEW.reviewed_at := now();
  END IF;
  
  -- Also set reviewed_at for rejections
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    NEW.reviewer_id := auth.uid();
    NEW.reviewed_at := now();
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_membership_request_update
  BEFORE UPDATE ON membership_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_membership_request_approval();

-- Notify admins of new request
CREATE OR REPLACE FUNCTION notify_membership_request()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  org_name TEXT;
  requester_name TEXT;
BEGIN
  -- Get organization name
  SELECT name INTO org_name FROM organizations WHERE id = NEW.organization_id;
  
  -- Get requester name
  SELECT COALESCE(first_name || ' ' || last_name, 'Someone') INTO requester_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Notify all org admins
  FOR admin_record IN
    SELECT DISTINCT ou.user_id
    FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.organization_id = NEW.organization_id
    AND ut.permission_level IN ('organization_admin', 'program_manager')
    AND ou.active_user = true
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      admin_record.user_id,
      'New Membership Request',
      requester_name || ' has requested to join ' || org_name,
      'info',
      '/dashboard/users?tab=pending'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_membership_request_created
  AFTER INSERT ON membership_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_membership_request();

-- Notify requester of decision
CREATE OR REPLACE FUNCTION notify_membership_decision()
RETURNS TRIGGER AS $$
DECLARE
  org_name TEXT;
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    SELECT name INTO org_name FROM organizations WHERE id = NEW.organization_id;
    
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' 
        THEN 'Membership Approved!' 
        ELSE 'Membership Request Update' 
      END,
      CASE WHEN NEW.status = 'approved'
        THEN 'Your request to join ' || org_name || ' has been approved. Welcome!'
        ELSE 'Your request to join ' || org_name || ' was not approved at this time.'
      END,
      CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'info' END,
      CASE WHEN NEW.status = 'approved' THEN '/dashboard' ELSE '/portal' END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_membership_decision
  AFTER UPDATE ON membership_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_membership_decision();