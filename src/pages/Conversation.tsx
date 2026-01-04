import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Send, MoreVertical, Archive, Bell, BellOff, Users, Target, Package } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageAttachmentUploader } from "@/components/messaging/MessageAttachmentUploader";
import { MessageAttachments } from "@/components/messaging/MessageAttachments";
import { ReadReceiptIndicator } from "@/components/messaging/ReadReceiptIndicator";
import { MessageReactions } from "@/components/messaging/MessageReactions";
import { MessageTemplatesPicker } from "@/components/messaging/MessageTemplatesPicker";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface Reaction {
  id: string;
  emoji: string;
  user_id: string | null;
  donor_profile_id: string | null;
}

interface Message {
  id: string;
  content: string;
  content_type: string;
  sent_at: string;
  sender_user_id: string | null;
  sender_donor_profile_id: string | null;
  sender_type: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
  sender?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface Participant {
  user_id: string | null;
  donor_profile_id: string | null;
  participant_type: string;
  role: string;
  last_read_at: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  donor_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface ConversationDetails {
  id: string;
  subject: string | null;
  conversation_type: string;
  context_type: string | null;
  context_id: string | null;
  created_at: string;
  participants: Participant[];
}

const Conversation = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { organizationUser } = useOrganizationUser();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [recipientReadAt, setRecipientReadAt] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState('Staff');

  // Fetch current user's name for typing indicator
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      if (data) {
        const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        setCurrentUserName(name || 'Staff');
      }
    };
    fetchUserName();
  }, [user?.id]);

  const { typingUsers, setIsTyping } = useTypingIndicator({
    conversationId: id || '',
    userId: user?.id,
    userName: currentUserName,
  });

  useEffect(() => {
    if (id) {
      fetchConversation();
      fetchMessages();
      markAsRead();
      
      // Subscribe to new messages
      const messagesChannel = supabase
        .channel(`conversation-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${id}`
          },
          (payload) => {
            const newMsg = payload.new as any;
            // Fetch sender info for the new message
            fetchSingleMessage(newMsg.id);
            markAsRead();
          }
        )
        .subscribe();

      // Subscribe to read receipt updates
      const readReceiptsChannel = supabase
        .channel(`read-receipts-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversation_participants',
            filter: `conversation_id=eq.${id}`
          },
          (payload) => {
            const updated = payload.new as any;
            // Only update if it's not our own read receipt
            if (updated.user_id !== user?.id && updated.last_read_at) {
              setRecipientReadAt(prev => {
                // Use the later read time
                if (!prev || new Date(updated.last_read_at) > new Date(prev)) {
                  return updated.last_read_at;
                }
                return prev;
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(readReceiptsChannel);
      };
    }
  }, [id, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    if (!id) return;
    
    try {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('id, subject, conversation_type, context_type, context_id, created_at')
        .eq('id', id)
        .single();

      if (convError) throw convError;

      // Get participants
      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          donor_profile_id,
          participant_type,
          role,
          muted_until,
          last_read_at,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          ),
          donor_profiles:donor_profile_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('conversation_id', id)
        .is('left_at', null);

      if (partError) throw partError;

      // Get earliest read time from other participants (for read receipts)
      const otherParticipants = participants?.filter(p => p.user_id !== user?.id) || [];
      if (otherParticipants.length > 0) {
        const readTimes = otherParticipants
          .map(p => p.last_read_at)
          .filter(Boolean) as string[];
        if (readTimes.length > 0) {
          // Use the minimum read time (earliest reader)
          setRecipientReadAt(readTimes.sort()[0]);
        }
      }

      // Check if current user is muted
      const myParticipation = participants?.find(p => p.user_id === user?.id);
      if (myParticipation?.muted_until) {
        setIsMuted(new Date(myParticipation.muted_until) > new Date());
      }

      setConversation({
        ...conv,
        participants: participants?.map(p => ({
          user_id: p.user_id,
          donor_profile_id: p.donor_profile_id,
          participant_type: p.participant_type,
          role: p.role,
          last_read_at: p.last_read_at,
          profile: p.profiles as any,
          donor_profile: p.donor_profiles as any
        })) || []
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error("Failed to load conversation");
    }
  };

  const fetchMessages = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          content_type,
          sent_at,
          sender_user_id,
          sender_donor_profile_id,
          sender_type,
          attachments,
          sender:sender_user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('conversation_id', id)
        .is('deleted_at', null)
        .order('sent_at', { ascending: true });

      if (error) throw error;

      // Fetch reactions for all messages
      const messageIds = data?.map(m => m.id) || [];
      let reactionsMap: Record<string, Reaction[]> = {};
      
      if (messageIds.length > 0) {
        const { data: reactionsData } = await supabase
          .from('message_reactions')
          .select('id, message_id, emoji, user_id, donor_profile_id')
          .in('message_id', messageIds);
        
        if (reactionsData) {
          reactionsMap = reactionsData.reduce((acc, r) => {
            if (!acc[r.message_id]) acc[r.message_id] = [];
            acc[r.message_id].push({
              id: r.id,
              emoji: r.emoji,
              user_id: r.user_id,
              donor_profile_id: r.donor_profile_id,
            });
            return acc;
          }, {} as Record<string, Reaction[]>);
        }
      }

      setMessages(data?.map(m => ({
        ...m,
        sender: m.sender as any,
        attachments: (m.attachments as unknown) as Attachment[] | undefined,
        reactions: reactionsMap[m.id] || [],
      })) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleMessage = async (messageId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        content_type,
        sent_at,
        sender_user_id,
        sender_donor_profile_id,
        sender_type,
        attachments,
        sender:sender_user_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('id', messageId)
      .single();

    if (!error && data) {
      setMessages(prev => [...prev, { 
        ...data, 
        sender: data.sender as any,
        attachments: (data.attachments as unknown) as Attachment[] | undefined
      }]);
    }
  };

  const markAsRead = async () => {
    if (!id || !user) return;
    
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', id)
      .eq('user_id', user.id);
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !id || !user) return;
    
    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_user_id: user.id,
          sender_type: 'internal',
          content: newMessage.trim() || (pendingAttachments.length > 0 ? '' : ''),
          content_type: pendingAttachments.length > 0 ? 'mixed' : 'text',
          attachments: pendingAttachments.length > 0 ? (pendingAttachments as unknown as any) : null
        })
        .select('id')
        .single();

      if (error) throw error;

      setNewMessage("");
      setPendingAttachments([]);
      
      // Trigger email notifications (fire and forget)
      if (data?.id) {
        supabase.functions.invoke('send-message-notification', {
          body: { conversationId: id, messageId: data.id }
        }).catch(err => console.error('Notification error:', err));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const toggleMute = async () => {
    if (!id || !user) return;
    
    const newMutedUntil = isMuted ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('conversation_participants')
      .update({ muted_until: newMutedUntil })
      .eq('conversation_id', id)
      .eq('user_id', user.id);

    if (!error) {
      setIsMuted(!isMuted);
      toast.success(isMuted ? "Notifications enabled" : "Notifications muted for 7 days");
    }
  };

  const archiveConversation = async () => {
    if (!id || !user) return;
    
    const { error } = await supabase
      .from('conversation_participants')
      .update({ is_archived: true })
      .eq('conversation_id', id)
      .eq('user_id', user.id);

    if (!error) {
      toast.success("Conversation archived");
      navigate('/dashboard/messages');
    }
  };

  const getOtherParticipants = () => {
    return conversation?.participants.filter(p => p.user_id !== user?.id) || [];
  };

  const getConversationTitle = () => {
    if (conversation?.subject) return conversation.subject;
    
    const others = getOtherParticipants();
    if (others.length === 0) return "Conversation";
    
    if (others.length === 1) {
      const other = others[0];
      if (other.profile) {
        return `${other.profile.first_name || ''} ${other.profile.last_name || ''}`.trim() || 'Unknown';
      }
      if (other.donor_profile) {
        return `${other.donor_profile.first_name || ''} ${other.donor_profile.last_name || ''}`.trim() || other.donor_profile.email;
      }
    }
    
    return `${others.length + 1} participants`;
  };

  const getSenderName = (message: Message) => {
    if (message.sender_user_id === user?.id) return "You";
    if (message.sender) {
      return `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || 'Unknown';
    }
    return "Unknown";
  };

  const getSenderInitials = (message: Message) => {
    if (message.sender) {
      return `${message.sender.first_name?.[0] || ''}${message.sender.last_name?.[0] || ''}`.toUpperCase() || '?';
    }
    return '?';
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const getContextIcon = () => {
    switch (conversation?.context_type) {
      case 'campaign': return <Target className="h-4 w-4" />;
      case 'order': return <Package className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <DashboardPageLayout
        segments={[
          { label: "Dashboard", path: "/dashboard" },
          { label: "Messages", path: "/dashboard/messages" },
          { label: "Loading..." }
        ]}
      >
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                    <Skeleton className="h-16 w-48 rounded-lg" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      segments={[
        { label: "Dashboard", path: "/dashboard" },
        { label: "Messages", path: "/dashboard/messages" },
        { label: getConversationTitle() }
      ]}
    >
      <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/messages')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  {getConversationTitle()}
                  {conversation?.context_type && (
                    <Badge variant="outline" className="text-xs">
                      {getContextIcon()}
                      <span className="ml-1 capitalize">{conversation.context_type}</span>
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {conversation?.participants.length} participants
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={toggleMute}>
                  {isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                  {isMuted ? "Unmute" : "Mute notifications"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={archiveConversation}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender_user_id === user?.id;
                const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender_user_id !== message.sender_user_id);
                
                return (
                  <div key={message.id} className={`flex gap-2 ${isOwn ? 'justify-end' : ''} group`}>
                    {!isOwn && (
                      <div className="w-8">
                        {showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getSenderInitials(message)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      {showAvatar && !isOwn && (
                        <p className="text-xs text-muted-foreground mb-1 ml-1">
                          {getSenderName(message)}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                        {message.attachments && message.attachments.length > 0 && (
                          <MessageAttachments attachments={message.attachments} isOwn={isOwn} />
                        )}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
                        <MessageReactions
                          messageId={message.id}
                          reactions={message.reactions || []}
                          currentUserId={user?.id}
                          onReactionChange={fetchMessages}
                          isOwn={isOwn}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {formatMessageDate(message.sent_at)}
                        </span>
                        {isOwn && (
                          <ReadReceiptIndicator
                            status={recipientReadAt && new Date(message.sent_at) <= new Date(recipientReadAt) ? 'read' : 'sent'}
                            readAt={recipientReadAt && new Date(message.sent_at) <= new Date(recipientReadAt) ? recipientReadAt : undefined}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Typing Indicator */}
          <TypingIndicator typingUsers={typingUsers} />

          {/* Input */}
          <div className="p-4 border-t shrink-0 space-y-2">
            {pendingAttachments.length > 0 && (
              <MessageAttachmentUploader
                conversationId={id || ''}
                onAttachmentsChange={setPendingAttachments}
                pendingAttachments={pendingAttachments}
                disabled={sending}
              />
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsTyping(false);
                sendMessage();
              }}
              className="flex gap-2"
            >
              <MessageAttachmentUploader
                conversationId={id || ''}
                onAttachmentsChange={setPendingAttachments}
                pendingAttachments={pendingAttachments}
                disabled={sending}
              />
              {organizationUser?.organization_id && (
                <MessageTemplatesPicker
                  organizationId={organizationUser.organization_id}
                  onSelectTemplate={(content) => setNewMessage(prev => prev ? `${prev}\n${content}` : content)}
                  canManage={['organization_admin', 'program_manager'].includes(organizationUser?.user_type?.permission_level || '')}
                />
              )}
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onInput={() => setIsTyping(true)}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || (!newMessage.trim() && pendingAttachments.length === 0)}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardPageLayout>
  );
};

export default Conversation;