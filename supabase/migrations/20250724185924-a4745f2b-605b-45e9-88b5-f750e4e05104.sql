-- Make group_id nullable in school_user table since some user types don't require a group
ALTER TABLE public.school_user ALTER COLUMN group_id DROP NOT NULL;