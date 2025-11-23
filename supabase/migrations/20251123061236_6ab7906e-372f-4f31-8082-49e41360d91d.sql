-- Create table for tracking email delivery status
CREATE TABLE IF NOT EXISTS public.email_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  year INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  resend_email_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_email ON email_delivery_log(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_type ON email_delivery_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_status ON email_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_year ON email_delivery_log(year);
CREATE INDEX IF NOT EXISTS idx_email_delivery_log_sent_at ON email_delivery_log(sent_at);

-- Enable RLS
ALTER TABLE public.email_delivery_log ENABLE ROW LEVEL SECURITY;

-- System admins can view all email logs
CREATE POLICY "System admins can view email logs"
ON public.email_delivery_log
FOR SELECT
USING (is_system_admin(auth.uid()));

-- System admins can insert email logs
CREATE POLICY "System admins can insert email logs"
ON public.email_delivery_log
FOR INSERT
WITH CHECK (is_system_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_email_delivery_log_updated_at
BEFORE UPDATE ON public.email_delivery_log
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();