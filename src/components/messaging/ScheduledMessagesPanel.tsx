import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Edit2, Send, X, MessageSquare, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationUser } from '@/hooks/useOrganizationUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';

interface ScheduledMessage {
  id: string;
  content: string;
  scheduled_for: string;
  status: string;
  conversation_id: string;
  conversation_subject: string | null;
  created_at: string;
}

export const ScheduledMessagesPanel = () => {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const { organizationUser } = useOrganizationUser();
  const navigate = useNavigate();

  const fetchScheduledMessages = async () => {
    if (!organizationUser?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          scheduled_for,
          status,
          conversation_id,
          created_at,
          conversations!inner(subject, organization_id)
        `)
        .eq('status', 'scheduled')
        .eq('conversations.organization_id', organizationUser.organization_id)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;

      setMessages(
        (data || []).map((m: any) => ({
          id: m.id,
          content: m.content,
          scheduled_for: m.scheduled_for,
          status: m.status,
          conversation_id: m.conversation_id,
          conversation_subject: m.conversations?.subject,
          created_at: m.created_at,
        }))
      );
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
      toast.error('Failed to load scheduled messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledMessages();
  }, [organizationUser?.organization_id]);

  const handleCancelMessage = async () => {
    if (!selectedMessageId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'cancelled' })
        .eq('id', selectedMessageId);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== selectedMessageId));
      toast.success('Scheduled message cancelled');
    } catch (error) {
      console.error('Error cancelling message:', error);
      toast.error('Failed to cancel message');
    } finally {
      setCancelDialogOpen(false);
      setSelectedMessageId(null);
    }
  };

  const handleSendNow = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          scheduled_for: null,
        })
        .eq('id', messageId);

      if (error) throw error;

      // Get the message to trigger notification
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        await supabase.functions.invoke('send-message-notification', {
          body: {
            conversationId: message.conversation_id,
            messageId: messageId,
          },
        });
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const openCancelDialog = (messageId: string) => {
    setSelectedMessageId(messageId);
    setCancelDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No scheduled messages</p>
            <p className="text-sm text-muted-foreground">
              Schedule a message from any conversation to see it here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Messages
            <Badge variant="secondary" className="ml-2">
              {messages.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">
                    {message.conversation_subject || 'Untitled conversation'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {message.content}
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Scheduled for {format(new Date(message.scheduled_for), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigate(`/dashboard/messages/${message.conversation_id}`)}
                  title="View conversation"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleSendNow(message.id)}
                  title="Send now"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => openCancelDialog(message.id)}
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Scheduled Message
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this scheduled message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Message</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Message
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
