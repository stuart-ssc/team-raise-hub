import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  subject: string | null;
  updated_at: string;
  organization_name: string;
  last_message: string | null;
  last_message_sender: string | null;
  unread_count: number;
}

export default function DonorPortalMessages() {
  const navigate = useNavigate();
  const { donorProfiles, isLoading: portalLoading } = useDonorPortal();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (donorProfiles.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const donorIds = donorProfiles.map(p => p.id);

        // Fetch conversations where the donor is a participant
        const { data: participants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            last_read_at,
            conversation:conversations (
              id,
              subject,
              updated_at,
              organization:organizations (
                name
              )
            )
          `)
          .in('donor_profile_id', donorIds)
          .is('left_at', null);

        if (participantsError) throw participantsError;

        // For each conversation, fetch the last message and unread count
        const conversationsData: Conversation[] = [];
        
        for (const p of participants || []) {
          const conv = p.conversation as any;
          if (!conv) continue;

          // Get last message
          const { data: lastMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('sent_at', { ascending: false })
            .limit(1);

          const lastMessage = lastMessages?.[0] as any;

          // Get sender name if exists
          let senderName = null;
          if (lastMessage?.sender_user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', lastMessage.sender_user_id)
              .single();
            
            if (profile) {
              senderName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Staff';
            }
          }

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .gt('created_at', p.last_read_at || '1970-01-01');

          conversationsData.push({
            id: conv.id,
            subject: conv.subject,
            updated_at: conv.updated_at,
            organization_name: conv.organization?.name || 'Unknown Organization',
            last_message: lastMessage?.content?.substring(0, 100) || null,
            last_message_sender: senderName,
            unread_count: unreadCount || 0,
          });
        }

        // Sort by updated_at desc
        conversationsData.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        setConversations(conversationsData);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!portalLoading) {
      fetchConversations();
    }
  }, [donorProfiles, portalLoading]);

  if (loading || portalLoading) {
    return (
      <DonorPortalLayout title="Messages">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </DonorPortalLayout>
    );
  }

  return (
    <DonorPortalLayout title="Messages" subtitle="Your conversations with organizations">
      <div className="space-y-6">
        {conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
              <p className="text-muted-foreground">
                When organizations send you messages, they'll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <Card 
                key={conv.id} 
                className={`hover:bg-accent/5 transition-colors cursor-pointer ${
                  conv.unread_count > 0 ? 'border-primary' : ''
                }`}
                onClick={() => navigate(`/portal/messages/${conv.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {conv.subject || 'No Subject'}
                        </h3>
                        {conv.unread_count > 0 && (
                          <Badge variant="default" className="shrink-0">
                            {conv.unread_count} new
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {conv.organization_name}
                      </p>
                      {conv.last_message && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {conv.last_message_sender && (
                            <span className="font-medium">{conv.last_message_sender}: </span>
                          )}
                          {conv.last_message}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DonorPortalLayout>
  );
}
