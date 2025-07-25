-- Add active_user column to school_user table
ALTER TABLE public.school_user 
ADD COLUMN active_user boolean NOT NULL DEFAULT true;