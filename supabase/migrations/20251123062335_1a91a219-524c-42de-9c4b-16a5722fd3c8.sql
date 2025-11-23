-- Add retry tracking fields to email_delivery_log
ALTER TABLE email_delivery_log
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS retry_eligible BOOLEAN DEFAULT true;

-- Add index for efficient retry queries
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_retry 
ON email_delivery_log(next_retry_at, status, retry_eligible) 
WHERE status = 'failed' AND retry_eligible = true AND retry_count < max_retries;

-- Add comment explaining retry logic
COMMENT ON COLUMN email_delivery_log.retry_eligible IS 'False for hard bounces (invalid email), true for temporary failures';
COMMENT ON COLUMN email_delivery_log.next_retry_at IS 'Calculated with exponential backoff: 1hr, 4hr, 16hr';
COMMENT ON COLUMN email_delivery_log.max_retries IS 'Maximum retry attempts (default 3)';
