-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('internal', 'donor', 'group')),
  subject TEXT,
  context_type TEXT, -- 'campaign', 'order', 'sponsorship', 'general'
  context_id UUID, -- Reference to campaign_id, order_id, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Create conversation participants table
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id), -- For internal users
  donor_profile_id UUID REFERENCES donor_profiles(id), -- For external donors
  participant_type TEXT NOT NULL CHECK (participant_type IN ('internal', 'donor')),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  last_read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  muted_until TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id),
  UNIQUE(conversation_id, donor_profile_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES profiles(id),
  sender_donor_profile_id UUID REFERENCES donor_profiles(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('internal', 'donor', 'system')),
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'file', 'image', 'system')),
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  reply_to_id UUID REFERENCES messages(id)
);

-- Add message notification preference to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_messages BOOLEAN DEFAULT true;

-- Add message notification preference to donor profiles
ALTER TABLE donor_profiles ADD COLUMN IF NOT EXISTS message_notification_email BOOLEAN DEFAULT true;

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is participant in conversation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_user_id UUID, p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id
    AND left_at IS NULL
  );
$$;

-- RLS Policies for conversations

-- Users can view conversations they participate in
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  is_conversation_participant(auth.uid(), id)
  OR is_system_admin(auth.uid())
);

-- Organization admins can view all org conversations
CREATE POLICY "Org admins can view all org conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_user ou
    JOIN user_type ut ON ou.user_type_id = ut.id
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id = conversations.organization_id
    AND ut.permission_level IN ('organization_admin', 'program_manager')
  )
);

-- Authenticated users can create conversations in their org
CREATE POLICY "Users can create conversations in their org"
ON conversations FOR INSERT
WITH CHECK (
  user_belongs_to_organization(auth.uid(), organization_id)
  OR is_system_admin(auth.uid())
);

-- Conversation owner can update
CREATE POLICY "Conversation owner can update"
ON conversations FOR UPDATE
USING (
  created_by = auth.uid()
  OR is_system_admin(auth.uid())
);

-- RLS Policies for conversation_participants

-- Participants can view other participants
CREATE POLICY "Participants can view conversation members"
ON conversation_participants FOR SELECT
USING (
  is_conversation_participant(auth.uid(), conversation_id)
  OR is_system_admin(auth.uid())
);

-- Users can add participants to conversations they own or are admin of
CREATE POLICY "Admins can add participants"
ON conversation_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
    AND cp.role IN ('owner', 'admin')
    AND cp.left_at IS NULL
  )
  OR is_system_admin(auth.uid())
  -- Allow initial owner to add themselves
  OR (
    conversation_participants.user_id = auth.uid()
    AND conversation_participants.role = 'owner'
  )
);

-- Participants can update their own participation (archive, mute, read status)
CREATE POLICY "Users can update their own participation"
ON conversation_participants FOR UPDATE
USING (
  user_id = auth.uid()
  OR is_system_admin(auth.uid())
);

-- RLS Policies for messages

-- Participants can view messages in their conversations
CREATE POLICY "Participants can view messages"
ON messages FOR SELECT
USING (
  is_conversation_participant(auth.uid(), conversation_id)
  OR is_system_admin(auth.uid())
);

-- Participants can send messages
CREATE POLICY "Participants can send messages"
ON messages FOR INSERT
WITH CHECK (
  is_conversation_participant(auth.uid(), conversation_id)
  AND sender_user_id = auth.uid()
  AND sender_type = 'internal'
);

-- Senders can update their own messages (edit)
CREATE POLICY "Senders can update their own messages"
ON messages FOR UPDATE
USING (
  sender_user_id = auth.uid()
  OR is_system_admin(auth.uid())
);

-- Create indexes for performance
CREATE INDEX idx_conversations_organization ON conversations(organization_id);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;

-- Function to update conversation updated_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Function to create notification on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant RECORD;
  conv_subject TEXT;
  sender_name TEXT;
BEGIN
  -- Get conversation subject
  SELECT subject INTO conv_subject FROM conversations WHERE id = NEW.conversation_id;
  
  -- Get sender name
  SELECT COALESCE(first_name || ' ' || last_name, 'Someone') INTO sender_name
  FROM profiles WHERE id = NEW.sender_user_id;
  
  -- Notify all participants except sender
  FOR participant IN
    SELECT cp.user_id
    FROM conversation_participants cp
    JOIN profiles p ON cp.user_id = p.id
    WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_user_id
    AND cp.left_at IS NULL
    AND cp.participant_type = 'internal'
    AND (cp.muted_until IS NULL OR cp.muted_until < now())
    AND COALESCE(p.notify_messages, true) = true
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      participant.user_id,
      'New Message' || CASE WHEN conv_subject IS NOT NULL THEN ': ' || conv_subject ELSE '' END,
      sender_name || ': ' || LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
      'info',
      '/dashboard/messages/' || NEW.conversation_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_new_message
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.sender_type = 'internal')
EXECUTE FUNCTION notify_new_message();