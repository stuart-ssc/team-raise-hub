-- Add reviewed_by and reviewed_at columns to membership_requests table
ALTER TABLE public.membership_requests
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;