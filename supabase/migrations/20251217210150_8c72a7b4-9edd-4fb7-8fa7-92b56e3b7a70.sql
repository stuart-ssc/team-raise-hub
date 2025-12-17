-- Drop the old foreign key constraint referencing school_user
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_attributed_roster_member_id_fkey;

-- Add new foreign key constraint referencing organization_user
ALTER TABLE orders 
ADD CONSTRAINT orders_attributed_roster_member_id_fkey 
FOREIGN KEY (attributed_roster_member_id) 
REFERENCES organization_user(id);