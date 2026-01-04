-- Add pinned_at and pinned_by columns to messages table
ALTER TABLE public.messages 
ADD COLUMN pinned_at timestamp with time zone DEFAULT NULL,
ADD COLUMN pinned_by uuid REFERENCES public.profiles(id) DEFAULT NULL;

-- Create index for faster pinned message queries
CREATE INDEX idx_messages_pinned ON public.messages(conversation_id, pinned_at) WHERE pinned_at IS NOT NULL;