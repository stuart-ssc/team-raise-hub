-- Create table for message reactions
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  donor_profile_id UUID REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT message_reactions_one_reactor CHECK (
    (user_id IS NOT NULL AND donor_profile_id IS NULL) OR
    (user_id IS NULL AND donor_profile_id IS NOT NULL)
  ),
  CONSTRAINT message_reactions_unique_per_user UNIQUE (message_id, user_id, emoji),
  CONSTRAINT message_reactions_unique_per_donor UNIQUE (message_id, donor_profile_id, emoji)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON public.message_reactions(user_id);
CREATE INDEX idx_message_reactions_donor_profile_id ON public.message_reactions(donor_profile_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions on messages in conversations they participate in
CREATE POLICY "Users can view reactions in their conversations"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE m.id = message_reactions.message_id
    AND (cp.user_id = auth.uid() OR cp.donor_profile_id IN (
      SELECT id FROM donor_profiles WHERE user_id = auth.uid()
    ))
    AND cp.left_at IS NULL
  )
);

-- Policy: Users can add reactions to messages in their conversations
CREATE POLICY "Users can add reactions to messages"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  (user_id = auth.uid() OR donor_profile_id IN (
    SELECT id FROM donor_profiles WHERE user_id = auth.uid()
  ))
  AND EXISTS (
    SELECT 1 FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE m.id = message_reactions.message_id
    AND (cp.user_id = auth.uid() OR cp.donor_profile_id IN (
      SELECT id FROM donor_profiles WHERE user_id = auth.uid()
    ))
    AND cp.left_at IS NULL
  )
);

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions
FOR DELETE
USING (
  user_id = auth.uid() OR donor_profile_id IN (
    SELECT id FROM donor_profiles WHERE user_id = auth.uid()
  )
);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;