-- Drop the existing foreign key that points to auth.users
ALTER TABLE public.organization_user 
DROP CONSTRAINT organization_user_user_id_fkey;

-- Create new foreign key pointing to profiles instead
ALTER TABLE public.organization_user 
ADD CONSTRAINT organization_user_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;