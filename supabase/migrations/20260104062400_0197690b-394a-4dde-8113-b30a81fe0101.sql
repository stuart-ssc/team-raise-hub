-- Enable full replica identity for complete row data
ALTER TABLE public.membership_requests REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.membership_requests;