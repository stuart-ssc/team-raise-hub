-- Add tags column to businesses table
ALTER TABLE businesses 
ADD COLUMN tags text[] DEFAULT '{}';

-- Add GIN index for better query performance on tags
CREATE INDEX idx_businesses_tags ON businesses USING GIN (tags);