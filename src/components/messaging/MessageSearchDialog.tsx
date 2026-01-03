import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MessageCircle, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MessageSearchResult {
  id: string;
  content: string;
  sent_at: string;
  conversation_id: string;
  conversation_subject: string | null;
  sender_name: string;
  sender_avatar_url: string | null;
}

interface MessageSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

const MessageSearchDialog = ({
  open,
  onOpenChange,
  organizationId,
}: MessageSearchDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchMessages = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !user) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      // Get conversations user participates in
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .is('left_at', null);

      if (!participations || participations.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const conversationIds = participations.map(p => p.conversation_id);

      // Search messages in those conversations
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sent_at,
          conversation_id,
          sender_user_id,
          conversations:conversation_id (
            subject,
            organization_id
          )
        `)
        .in('conversation_id', conversationIds)
        .ilike('content', `%${searchQuery}%`)
        .is('deleted_at', null)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Filter by organization and get sender info
      const filteredMessages = messages?.filter(
        m => (m.conversations as any)?.organization_id === organizationId
      ) || [];

      // Get sender profiles
      const senderIds = [...new Set(filteredMessages.map(m => m.sender_user_id).filter(Boolean))];
      
      let senderProfiles: Record<string, { first_name: string | null; last_name: string | null; avatar_url: string | null }> = {};
      
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', senderIds);
        
        senderProfiles = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as typeof senderProfiles);
      }

      const searchResults: MessageSearchResult[] = filteredMessages.map(m => {
        const sender = m.sender_user_id ? senderProfiles[m.sender_user_id] : null;
        return {
          id: m.id,
          content: m.content,
          sent_at: m.sent_at,
          conversation_id: m.conversation_id,
          conversation_subject: (m.conversations as any)?.subject || null,
          sender_name: sender 
            ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || 'Unknown'
            : 'Unknown',
          sender_avatar_url: sender?.avatar_url || null,
        };
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Error searching messages:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user, organizationId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMessages(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchMessages]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSearched(false);
    }
  }, [open]);

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };

  const handleResultClick = (result: MessageSearchResult) => {
    onOpenChange(false);
    navigate(`/dashboard/messages/${result.conversation_id}?highlight=${result.id}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Messages
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search message content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="space-y-3 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1 p-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="flex items-start gap-3 p-2 hover:bg-muted/50 cursor-pointer rounded-lg transition-colors group"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={result.sender_avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(result.sender_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-foreground">
                          {result.sender_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(result.sent_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {highlightMatch(result.content, query)}
                      </p>
                      {result.conversation_subject && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {result.conversation_subject}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            ) : searched && query.length >= 2 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No messages found for "{query}"
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageSearchDialog;
