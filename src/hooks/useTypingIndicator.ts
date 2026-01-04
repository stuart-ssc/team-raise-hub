import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingUser {
  name: string;
  oderId?: string;
  donorProfileId?: string;
}

interface UseTypingIndicatorOptions {
  conversationId: string;
  userId?: string;
  donorProfileId?: string;
  userName: string;
}

export const useTypingIndicator = ({
  conversationId,
  userId,
  donorProfileId,
  userName,
}: UseTypingIndicatorOptions) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          (presences as any[]).forEach((presence) => {
            // Don't show our own typing indicator
            if (userId && presence.userId === userId) return;
            if (donorProfileId && presence.donorProfileId === donorProfileId) return;

            if (presence.isTyping) {
              users.push({
                name: presence.name,
                oderId: presence.userId,
                donorProfileId: presence.donorProfileId,
              });
            }
          });
        });

        setTypingUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track our initial presence (not typing)
          await channel.track({
            userId,
            donorProfileId,
            name: userName,
            isTyping: false,
          });
        }
      });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, donorProfileId, userName]);

  const setIsTyping = useCallback((typing: boolean) => {
    if (!channelRef.current) return;

    // Only update if state changed
    if (isTypingRef.current === typing) return;
    isTypingRef.current = typing;

    channelRef.current.track({
      userId,
      donorProfileId,
      name: userName,
      isTyping: typing,
    });

    // Auto-stop typing after 3 seconds of no input
    if (typing) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        channelRef.current?.track({
          userId,
          donorProfileId,
          name: userName,
          isTyping: false,
        });
      }, 3000);
    }
  }, [userId, donorProfileId, userName]);

  return { typingUsers, setIsTyping };
};
