import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquarePlus, Search, Archive, Users, MessageCircle, Building2, Target, Package, Filter, X, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import NewConversationDialog from "@/components/messaging/NewConversationDialog";
import MessageSearchDialog from "@/components/messaging/MessageSearchDialog";
import { ScheduledMessagesPanel } from "@/components/messaging/ScheduledMessagesPanel";

interface ConversationWithDetails {
  id: string;
  subject: string | null;
  conversation_type: string;
  context_type: string | null;
  context_id: string | null;
  updated_at: string;
  created_at: string;
  participants: {
    user_id: string | null;
    donor_profile_id: string | null;
    participant_type: string;
    last_read_at: string | null;
    is_archived: boolean;
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
  }[];
  last_message?: {
    content: string;
    sent_at: string;
    sender_user_id: string | null;
  };
  unread_count: number;
  context_name?: string;
}

interface ContextOption {
  id: string;
  name: string;
  type: 'campaign' | 'order';
}

const Messages = () => {
  const { user } = useAuth();
  const { organizationUser } = useOrganizationUser();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [contextFilter, setContextFilter] = useState<string>("all");
  const [contextOptions, setContextOptions] = useState<ContextOption[]>([]);

  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchConversations();
      fetchContextOptions();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('messages-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          () => {
            fetchConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [organizationUser?.organization_id]);

  const fetchContextOptions = async () => {
    if (!organizationUser?.organization_id) return;

    try {
      // Fetch campaigns for this organization
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          groups!inner (
            organization_id
          )
        `)
        .eq('groups.organization_id', organizationUser.organization_id);

      const options: ContextOption[] = [];

      if (campaigns) {
        campaigns.forEach(c => {
          options.push({ id: c.id, name: c.name, type: 'campaign' });
        });
      }

      // Only add orders that are linked to conversations for this org
      const { data: orderConversations } = await supabase
        .from('conversations')
        .select('context_id')
        .eq('organization_id', organizationUser.organization_id)
        .eq('context_type', 'order')
        .not('context_id', 'is', null);

      if (orderConversations && orderConversations.length > 0) {
        const orderIds = orderConversations.map(c => c.context_id).filter(Boolean) as string[];
        const { data: orders } = await supabase
          .from('orders')
          .select('id, customer_email, created_at')
          .in('id', orderIds);

        if (orders) {
          orders.forEach(o => {
            options.push({ 
              id: o.id, 
              name: `Order - ${o.customer_email?.split('@')[0] || 'Unknown'}`, 
              type: 'order' 
            });
          });
        }
      }

      setContextOptions(options);
    } catch (error) {
      console.error('Error fetching context options:', error);
    }
  };

  const fetchConversations = async () => {
    if (!user || !organizationUser?.organization_id) return;
    
    try {
      // Get conversations where user is a participant
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          last_read_at,
          is_archived,
          conversations:conversation_id (
            id,
            subject,
            conversation_type,
            context_type,
            context_id,
            updated_at,
            created_at,
            organization_id
          )
        `)
        .eq('user_id', user.id)
        .is('left_at', null)
        .order('conversations(updated_at)', { ascending: false });

      if (partError) throw partError;

      // Get full conversation details for each
      const conversationIds = participations?.map(p => p.conversation_id) || [];
      
      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get all participants for these conversations
      const { data: allParticipants, error: allPartError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          user_id,
          donor_profile_id,
          participant_type,
          last_read_at,
          is_archived,
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
        .in('conversation_id', conversationIds)
        .is('left_at', null);

      if (allPartError) throw allPartError;

      // Get last message for each conversation
      const { data: lastMessages, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id, content, sent_at, sender_user_id')
        .in('conversation_id', conversationIds)
        .is('deleted_at', null)
        .order('sent_at', { ascending: false });

      if (msgError) throw msgError;

      // Get context names for campaigns
      const campaignContextIds = participations
        ?.filter(p => p.conversations && (p.conversations as any).context_type === 'campaign' && (p.conversations as any).context_id)
        .map(p => (p.conversations as any).context_id) || [];
      
      let campaignNames: Record<string, string> = {};
      if (campaignContextIds.length > 0) {
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, name')
          .in('id', campaignContextIds);
        
        if (campaigns) {
          campaigns.forEach(c => { campaignNames[c.id] = c.name; });
        }
      }

      // Get context names for orders
      const orderContextIds = participations
        ?.filter(p => p.conversations && (p.conversations as any).context_type === 'order' && (p.conversations as any).context_id)
        .map(p => (p.conversations as any).context_id) || [];
      
      let orderNames: Record<string, string> = {};
      if (orderContextIds.length > 0) {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, customer_email')
          .in('id', orderContextIds);
        
        if (orders) {
          orders.forEach(o => { orderNames[o.id] = `Order - ${o.customer_email?.split('@')[0] || 'Unknown'}`; });
        }
      }

      // Get unread counts and build conversation details
      const conversationsWithDetails: ConversationWithDetails[] = participations
        ?.filter(p => p.conversations && (p.conversations as any).organization_id === organizationUser.organization_id)
        .map(p => {
          const conv = p.conversations as any;
          const convParticipants = allParticipants?.filter(ap => ap.conversation_id === p.conversation_id) || [];
          const lastMessage = lastMessages?.find(m => m.conversation_id === p.conversation_id);
          
          // Count unread messages
          const unreadCount = lastMessages?.filter(m => 
            m.conversation_id === p.conversation_id &&
            new Date(m.sent_at) > new Date(p.last_read_at || 0) &&
            m.sender_user_id !== user.id
          ).length || 0;

          // Get context name
          let contextName: string | undefined;
          if (conv.context_type === 'campaign' && conv.context_id) {
            contextName = campaignNames[conv.context_id];
          } else if (conv.context_type === 'order' && conv.context_id) {
            contextName = orderNames[conv.context_id];
          }

          return {
            id: conv.id,
            subject: conv.subject,
            conversation_type: conv.conversation_type,
            context_type: conv.context_type,
            context_id: conv.context_id,
            updated_at: conv.updated_at,
            created_at: conv.created_at,
            participants: convParticipants.map(cp => ({
              user_id: cp.user_id,
              donor_profile_id: cp.donor_profile_id,
              participant_type: cp.participant_type,
              last_read_at: cp.last_read_at,
              is_archived: cp.is_archived,
              profile: cp.profiles as any,
              donor_profile: cp.donor_profiles as any
            })),
            last_message: lastMessage ? {
              content: lastMessage.content,
              sent_at: lastMessage.sent_at,
              sender_user_id: lastMessage.sender_user_id
            } : undefined,
            unread_count: unreadCount,
            context_name: contextName
          };
        }) || [];

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipants = (conversation: ConversationWithDetails) => {
    return conversation.participants.filter(p => p.user_id !== user?.id);
  };

  const getConversationTitle = (conversation: ConversationWithDetails) => {
    if (conversation.subject) return conversation.subject;
    
    const others = getOtherParticipants(conversation);
    if (others.length === 0) return "No participants";
    
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

  const getConversationAvatar = (conversation: ConversationWithDetails) => {
    const others = getOtherParticipants(conversation);
    if (others.length === 1 && others[0].profile?.avatar_url) {
      return others[0].profile.avatar_url;
    }
    return null;
  };

  const getConversationInitials = (conversation: ConversationWithDetails) => {
    const others = getOtherParticipants(conversation);
    if (others.length === 0) return "?";
    
    const other = others[0];
    if (other.profile) {
      return `${other.profile.first_name?.[0] || ''}${other.profile.last_name?.[0] || ''}`.toUpperCase() || '?';
    }
    if (other.donor_profile) {
      return `${other.donor_profile.first_name?.[0] || ''}${other.donor_profile.last_name?.[0] || other.donor_profile.email[0]}`.toUpperCase();
    }
    return "?";
  };

  const filteredConversations = conversations.filter(conv => {
    // Filter by tab
    if (activeTab === "internal" && conv.conversation_type !== "internal") return false;
    if (activeTab === "donor" && conv.conversation_type !== "donor") return false;
    if (activeTab === "archived" && !conv.participants.find(p => p.user_id === user?.id)?.is_archived) return false;
    if (activeTab !== "archived" && conv.participants.find(p => p.user_id === user?.id)?.is_archived) return false;
    
    // Filter by context (campaign or order)
    if (contextFilter !== "all") {
      if (contextFilter === "campaign" && conv.context_type !== "campaign") return false;
      if (contextFilter === "order" && conv.context_type !== "order") return false;
      if (contextFilter !== "campaign" && contextFilter !== "order" && conv.context_id !== contextFilter) return false;
    }
    
    // Filter by search (includes title, last message, and context name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = getConversationTitle(conv).toLowerCase();
      const lastMsg = conv.last_message?.content.toLowerCase() || '';
      const contextName = conv.context_name?.toLowerCase() || '';
      const contextType = conv.context_type?.toLowerCase() || '';
      return title.includes(query) || lastMsg.includes(query) || contextName.includes(query) || contextType.includes(query);
    }
    
    return true;
  });

  const clearContextFilter = () => setContextFilter("all");

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <DashboardPageLayout
      segments={[
        { label: "Dashboard", path: "/dashboard" },
        { label: "Messages" }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Messages
              {totalUnread > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {totalUnread} new
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Communicate with your team and donors
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        {/* Search and Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSearchDialogOpen(true)}
                  className="shrink-0"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search All Messages
                </Button>
              </div>
              
              {/* Context Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={contextFilter} onValueChange={setContextFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conversations</SelectItem>
                    <SelectItem value="campaign">
                      <span className="flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        All Campaigns
                      </span>
                    </SelectItem>
                    <SelectItem value="order">
                      <span className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        All Orders
                      </span>
                    </SelectItem>
                    {contextOptions.filter(o => o.type === 'campaign').length > 0 && (
                      <>
                        {contextOptions.filter(o => o.type === 'campaign').map(option => (
                          <SelectItem key={option.id} value={option.id}>
                            <span className="flex items-center gap-2">
                              <Target className="h-3 w-3 text-primary" />
                              {option.name}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {contextOptions.filter(o => o.type === 'order').length > 0 && (
                      <>
                        {contextOptions.filter(o => o.type === 'order').map(option => (
                          <SelectItem key={option.id} value={option.id}>
                            <span className="flex items-center gap-2">
                              <Package className="h-3 w-3 text-orange-500" />
                              {option.name}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {contextFilter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={clearContextFilter}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">All</span>
                </TabsTrigger>
                <TabsTrigger value="internal" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Team</span>
                </TabsTrigger>
                <TabsTrigger value="donor" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Donors</span>
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Scheduled</span>
                </TabsTrigger>
                <TabsTrigger value="archived" className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  <span className="hidden sm:inline">Archived</span>
                </TabsTrigger>
              </TabsList>

              {activeTab === "scheduled" ? (
                <ScheduledMessagesPanel />
              ) : (
                <TabsContent value={activeTab} className="mt-0">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-1">No messages yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {activeTab === "all" 
                          ? "Start a conversation to get in touch with your team or donors"
                          : `No ${activeTab} messages found`}
                      </p>
                      <Button onClick={() => setDialogOpen(true)} variant="outline">
                        <MessageSquarePlus className="h-4 w-4 mr-2" />
                        Start a Conversation
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => navigate(`/dashboard/messages/${conversation.id}`)}
                          className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors rounded-lg ${
                            conversation.unread_count > 0 ? 'bg-primary/5' : ''
                          }`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getConversationAvatar(conversation) || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getConversationInitials(conversation)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={`text-sm truncate ${conversation.unread_count > 0 ? 'font-semibold' : 'font-medium'}`}>
                                {getConversationTitle(conversation)}
                              </h4>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <p className={`text-xs truncate ${conversation.unread_count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {conversation.last_message?.content || "No messages yet"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {conversation.context_name && (
                                  <Badge variant="outline" className="h-5 text-xs max-w-[120px] truncate flex items-center gap-1">
                                    {conversation.context_type === 'campaign' ? (
                                      <Target className="h-3 w-3 shrink-0" />
                                    ) : (
                                      <Package className="h-3 w-3 shrink-0" />
                                    )}
                                    <span className="truncate">{conversation.context_name}</span>
                                  </Badge>
                                )}
                                {conversation.context_type && !conversation.context_name && (
                                  <Badge variant="outline" className="h-5 text-xs">
                                    {conversation.context_type === 'campaign' ? (
                                      <Target className="h-3 w-3" />
                                    ) : (
                                      <Package className="h-3 w-3" />
                                    )}
                                  </Badge>
                                )}
                                {conversation.unread_count > 0 && (
                                  <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center text-xs">
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConversationCreated={(id) => navigate(`/dashboard/messages/${id}`)}
      />

      {organizationUser?.organization_id && (
        <MessageSearchDialog
          open={searchDialogOpen}
          onOpenChange={setSearchDialogOpen}
          organizationId={organizationUser.organization_id}
        />
      )}
    </DashboardPageLayout>
  );
};

export default Messages;