-- Remove the existing unique constraint on user_id
ALTER TABLE public.school_user DROP CONSTRAINT IF EXISTS school_user_user_id_key;

-- Add a composite unique constraint to prevent identical entries
-- This allows a user to have multiple roles/groups but prevents exact duplicates
ALTER TABLE public.school_user 
ADD CONSTRAINT school_user_unique_entry 
UNIQUE (user_id, school_id, user_type_id, group_id);