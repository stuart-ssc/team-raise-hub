-- Add scheduling fields to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';

-- Add check constraint for status values
ALTER TABLE public.messages
ADD CONSTRAINT messages_status_check 
CHECK (status IN ('draft', 'scheduled', 'sent', 'failed', 'cancelled'));

-- Create index for efficient querying of scheduled messages
CREATE INDEX IF NOT EXISTS idx_messages_scheduled 
ON public.messages(status, scheduled_for) 
WHERE status = 'scheduled';

-- Update existing messages to have 'sent' status
UPDATE public.messages SET status = 'sent' WHERE status IS NULL;