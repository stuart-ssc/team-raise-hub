-- Add street address fields to organizations table
ALTER TABLE organizations 
ADD COLUMN address_line1 text,
ADD COLUMN address_line2 text;