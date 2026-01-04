-- Table to store device tokens for push notifications
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_info JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_token)
);

-- Table to log push notifications sent
CREATE TABLE IF NOT EXISTS push_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  tokens_sent INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  fcm_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

-- Policies for push_notification_tokens
CREATE POLICY "Users can manage their own tokens"
  ON push_notification_tokens FOR ALL
  USING (auth.uid() = user_id);

-- System admin policy for push_notification_tokens
CREATE POLICY "System admins can manage all tokens"
  ON push_notification_tokens FOR ALL
  USING (is_system_admin(auth.uid()));

-- Policies for push_notification_log (read-only for users)
CREATE POLICY "Users can view their own notification logs"
  ON push_notification_log FOR SELECT
  USING (auth.uid() = user_id);

-- System admin policy for push_notification_log
CREATE POLICY "System admins can manage notification logs"
  ON push_notification_log FOR ALL
  USING (is_system_admin(auth.uid()));

-- Index for faster lookups
CREATE INDEX idx_push_tokens_user_active ON push_notification_tokens(user_id, active);

-- Add push notification preference to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS push_notify_messages BOOLEAN DEFAULT true;