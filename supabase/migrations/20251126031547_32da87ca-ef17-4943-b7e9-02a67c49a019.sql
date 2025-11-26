-- Add active_user_count column to organizations table
ALTER TABLE organizations 
ADD COLUMN active_user_count INTEGER DEFAULT 0;

-- Backfill existing data with accurate counts
UPDATE organizations o
SET active_user_count = (
  SELECT COUNT(DISTINCT ou.user_id)
  FROM organization_user ou
  WHERE ou.organization_id = o.id
  AND ou.active_user = true
);

-- Create trigger function to keep count in sync
CREATE OR REPLACE FUNCTION update_organization_active_user_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.active_user = true THEN
      UPDATE organizations 
      SET active_user_count = active_user_count + 1
      WHERE id = NEW.organization_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE (active_user flag changed)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.active_user = true AND NEW.active_user = false THEN
      UPDATE organizations 
      SET active_user_count = active_user_count - 1
      WHERE id = NEW.organization_id;
    ELSIF OLD.active_user = false AND NEW.active_user = true THEN
      UPDATE organizations 
      SET active_user_count = active_user_count + 1
      WHERE id = NEW.organization_id;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.active_user = true THEN
      UPDATE organizations 
      SET active_user_count = active_user_count - 1
      WHERE id = OLD.organization_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on organization_user table
DROP TRIGGER IF EXISTS sync_organization_active_user_count ON organization_user;
CREATE TRIGGER sync_organization_active_user_count
AFTER INSERT OR UPDATE OR DELETE ON organization_user
FOR EACH ROW EXECUTE FUNCTION update_organization_active_user_count();