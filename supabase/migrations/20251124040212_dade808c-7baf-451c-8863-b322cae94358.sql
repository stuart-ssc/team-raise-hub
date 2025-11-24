-- Fix search_path security warnings for new functions
DROP FUNCTION IF EXISTS update_businesses_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION update_businesses_updated_at();

DROP FUNCTION IF EXISTS log_business_update() CASCADE;
CREATE OR REPLACE FUNCTION log_business_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE TRIGGER log_business_updates
AFTER UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION log_business_update();