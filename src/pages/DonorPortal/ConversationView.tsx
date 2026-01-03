import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_user_id: string | null;
  sender_donor_profile_id: string | null;
  sender_name: string;
  is_from_donor: boolean;
}

interface ConversationDetails {
  id: string;
  subject: string | null;
  organization_name: string;
}

export default function DonorPortalConversationView() {
  const { id: conversationId } = useParams();
  const { donorProfiles, isLoading: portalLoading } = useDonorPortal();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const donorIds = donorProfiles.map(p => p.id);

  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || donorProfiles.length === 0) return;

      try {
        // Fetch conversation details
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select(`
            id,
            subject,
            organization:organizations (name)
          `)
          .eq('id', conversationId)
          .single();

        if (convError) throw convError;

        setConversation({
          id: convData.id,
          subject: convData.subject,
          organization_name: (convData.organization as any)?.name || 'Unknown Organization',
        });

        // Fetch messages
        await fetchMessages();

        // Mark as read
        await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .in('donor_profile_id', donorIds);

      } catch (error) {
        console.error('Error fetching conversation:', error);
        toast({
          title: "Error",
          description: "Failed to load conversation",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!portalLoading) {
      fetchConversation();
    }
  }, [conversationId, donorProfiles, portalLoading]);

  const fetchMessages = async () => {
    if (!conversationId) return;

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Fetch sender names
    const messagesWithNames: Message[] = [];
    for (const msg of (messagesData || []) as any[]) {
      let senderName = 'Unknown';
      let isFromDonor = false;

      if (msg.sender_user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', msg.sender_user_id)
          .single();
        
        if (profile) {
          senderName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Staff';
        }
      } else if (msg.sender_donor_profile_id) {
        isFromDonor = donorIds.includes(msg.sender_donor_profile_id);
        if (isFromDonor) {
          senderName = 'You';
        } else {
          const { data: donor } = await supabase
            .from('donor_profiles')
            .select('first_name, last_name, email')
            .eq('id', msg.sender_donor_profile_id)
            .single();
          
          if (donor) {
            senderName = `${donor.first_name || ''} ${donor.last_name || ''}`.trim() || donor.email;
          }
        }
      }

      messagesWithNames.push({
        id: msg.id,
        content: msg.content,
        created_at: msg.sent_at,
        sender_user_id: msg.sender_user_id,
        sender_donor_profile_id: msg.sender_donor_profile_id,
        sender_name: senderName,
        is_from_donor: isFromDonor,
      });
    }

    setMessages(messagesWithNames);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || donorProfiles.length === 0) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_donor_profile_id: donorProfiles[0].id,
          sender_type: 'donor',
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
      await fetchMessages();

      // Send notification to staff (TODO: implement edge function trigger)
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  if (loading || portalLoading) {
    return (
      <DonorPortalLayout title="Conversation">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DonorPortalLayout>
    );
  }

  if (!conversation) {
    return (
      <DonorPortalLayout title="Conversation">
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold mb-2">Conversation not found</h2>
          <Button asChild>
            <Link to="/portal/messages">Back to Messages</Link>
          </Button>
        </div>
      </DonorPortalLayout>
    );
  }

  return (
    <DonorPortalLayout title={conversation.subject || 'Conversation'}>
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        <div className="mb-4">
          <Button variant="ghost" asChild>
            <Link to="/portal/messages">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Link>
          </Button>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-base">
              {conversation.subject || 'No Subject'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{conversation.organization_name}</p>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.is_from_donor ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={message.is_from_donor ? 'bg-primary text-primary-foreground' : ''}>
                    {message.sender_name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 max-w-[75%] ${message.is_from_donor ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{message.sender_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.is_from_donor
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>
    </DonorPortalLayout>
  );
}
