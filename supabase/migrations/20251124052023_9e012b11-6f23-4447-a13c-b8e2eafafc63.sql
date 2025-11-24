-- Add archive support to businesses table
ALTER TABLE businesses 
ADD COLUMN archived_at TIMESTAMPTZ,
ADD COLUMN archived_by UUID REFERENCES auth.users(id);

-- Create index for filtering archived businesses efficiently
CREATE INDEX idx_businesses_archived_at ON businesses(archived_at)
WHERE archived_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN businesses.archived_at IS 'Timestamp when business was archived/deactivated';
COMMENT ON COLUMN businesses.archived_by IS 'User ID who archived the business';