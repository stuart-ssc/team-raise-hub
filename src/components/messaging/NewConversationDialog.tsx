import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X, Users, Heart, Target, Package, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
  preselectedUserId?: string;
  preselectedDonorId?: string;
  contextType?: 'campaign' | 'order' | null;
  contextId?: string;
  contextLabel?: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface Order {
  id: string;
  donor_name: string;
  campaign_name: string;
}

interface OrgUser {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  user_type_name: string;
}

interface Donor {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

const NewConversationDialog = ({
  open,
  onOpenChange,
  onConversationCreated,
  preselectedUserId,
  preselectedDonorId,
  contextType: initialContextType,
  contextId: initialContextId,
  contextLabel: initialContextLabel
}: NewConversationDialogProps) => {
  const { user } = useAuth();
  const { organizationUser } = useOrganizationUser();
  const [activeTab, setActiveTab] = useState(preselectedDonorId ? "donor" : "internal");
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<OrgUser[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [subject, setSubject] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [donorSearchOpen, setDonorSearchOpen] = useState(false);
  
  // Context linking state
  const [contextType, setContextType] = useState<'campaign' | 'order' | null>(initialContextType || null);
  const [contextId, setContextId] = useState<string | undefined>(initialContextId);
  const [contextLabel, setContextLabel] = useState<string | undefined>(initialContextLabel);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [contextSelectorOpen, setContextSelectorOpen] = useState(false);
  const [contextPickerOpen, setContextPickerOpen] = useState(false);

  useEffect(() => {
    if (open && organizationUser?.organization_id) {
      fetchOrgUsers();
      fetchDonors();
      fetchCampaigns();
      fetchOrders();
    }
  }, [open, organizationUser?.organization_id]);

  useEffect(() => {
    // Reset context when dialog opens with new props
    if (open) {
      setContextType(initialContextType || null);
      setContextId(initialContextId);
      setContextLabel(initialContextLabel);
      if (initialContextLabel && !subject) {
        setSubject(`Re: ${initialContextLabel}`);
      }
    }
  }, [open, initialContextType, initialContextId, initialContextLabel]);

  useEffect(() => {
    if (preselectedUserId && orgUsers.length > 0) {
      const preselected = orgUsers.find(u => u.user_id === preselectedUserId);
      if (preselected) {
        setSelectedUsers([preselected]);
      }
    }
    if (preselectedDonorId && donors.length > 0) {
      const preselected = donors.find(d => d.id === preselectedDonorId);
      if (preselected) {
        setSelectedDonor(preselected);
        setActiveTab("donor");
      }
    }
  }, [preselectedUserId, preselectedDonorId, orgUsers, donors]);

  const fetchOrgUsers = async () => {
    if (!organizationUser?.organization_id) return;

    const { data, error } = await supabase
      .from('organization_user')
      .select(`
        id,
        user_id,
        profiles!organization_user_user_id_fkey (
          first_name,
          last_name,
          avatar_url
        ),
        user_type!organization_user_user_type_id_fkey (
          name
        )
      `)
      .eq('organization_id', organizationUser.organization_id)
      .eq('active_user', true)
      .neq('user_id', user?.id);

    if (error) {
      console.error('Error fetching org users:', error);
    }
    
    if (data) {
      console.log('Org users data:', data);
      setOrgUsers(data.map(u => ({
        id: u.id,
        user_id: u.user_id,
        first_name: (u.profiles as any)?.first_name,
        last_name: (u.profiles as any)?.last_name,
        avatar_url: (u.profiles as any)?.avatar_url,
        user_type_name: (u.user_type as any)?.name
      })));
    }
  };

  const fetchDonors = async () => {
    if (!organizationUser?.organization_id) return;

    const { data, error } = await supabase
      .from('donor_profiles')
      .select('id, email, first_name, last_name')
      .eq('organization_id', organizationUser.organization_id)
      .order('last_name');

    if (!error && data) {
      setDonors(data);
    }
  };

  const fetchCampaigns = async () => {
    if (!organizationUser?.organization_id) return;

    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name, groups!inner(organization_id)')
      .eq('groups.organization_id', organizationUser.organization_id)
      .eq('status', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setCampaigns(data.map(c => ({ id: c.id, name: c.name })));
    }
  };

  const fetchOrders = async () => {
    if (!organizationUser?.organization_id) return;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        donor_profiles!inner(first_name, last_name, email, organization_id),
        campaign_items!inner(campaigns!inner(name))
      `)
      .eq('donor_profiles.organization_id', organizationUser.organization_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setOrders(data.map(o => ({
        id: o.id,
        donor_name: `${(o.donor_profiles as any)?.first_name || ''} ${(o.donor_profiles as any)?.last_name || ''}`.trim() || (o.donor_profiles as any)?.email,
        campaign_name: (o.campaign_items as any)?.campaigns?.name || 'Unknown Campaign'
      })));
    }
  };

  const handleCreateConversation = async () => {
    if (!user || !organizationUser?.organization_id) return;
    
    if (activeTab === "internal" && selectedUsers.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    if (activeTab === "donor" && !selectedDonor) {
      toast.error("Please select a donor");
      return;
    }
    if (!initialMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setLoading(true);
    try {
      // Check for existing 1:1 conversation
      if (activeTab === "internal" && selectedUsers.length === 1) {
        const { data: existingConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (existingConvs) {
          for (const ec of existingConvs) {
            const { data: otherParts } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', ec.conversation_id);

            if (otherParts?.length === 2) {
              const hasSelectedUser = otherParts.some(p => p.user_id === selectedUsers[0].user_id);
              if (hasSelectedUser) {
                // Found existing conversation, just add message
                await supabase.from('messages').insert({
                  conversation_id: ec.conversation_id,
                  sender_user_id: user.id,
                  sender_type: 'internal',
                  content: initialMessage.trim(),
                  content_type: 'text'
                });
                onConversationCreated(ec.conversation_id);
                resetForm();
                return;
              }
            }
          }
        }
      }

      // Create new conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          organization_id: organizationUser.organization_id,
          conversation_type: activeTab === "donor" ? 'donor' : selectedUsers.length > 1 ? 'group' : 'internal',
          subject: subject.trim() || null,
          created_by: user.id,
          context_type: contextType,
          context_id: contextId
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add current user as owner
      await supabase.from('conversation_participants').insert({
        conversation_id: conv.id,
        user_id: user.id,
        participant_type: 'internal',
        role: 'owner'
      });

      // Add other participants
      if (activeTab === "internal") {
        for (const selectedUser of selectedUsers) {
          await supabase.from('conversation_participants').insert({
            conversation_id: conv.id,
            user_id: selectedUser.user_id,
            participant_type: 'internal',
            role: 'member'
          });
        }
      } else if (selectedDonor) {
        await supabase.from('conversation_participants').insert({
          conversation_id: conv.id,
          donor_profile_id: selectedDonor.id,
          participant_type: 'donor',
          role: 'member'
        });
      }

      // Send initial message
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_user_id: user.id,
        sender_type: 'internal',
        content: initialMessage.trim(),
        content_type: 'text'
      });

      onConversationCreated(conv.id);
      resetForm();
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error("Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUsers([]);
    setSelectedDonor(null);
    setSubject("");
    setInitialMessage("");
    setContextType(null);
    setContextId(undefined);
    setContextLabel(undefined);
    setContextSelectorOpen(false);
    onOpenChange(false);
  };

  const selectContext = (type: 'campaign' | 'order', id: string, label: string) => {
    setContextType(type);
    setContextId(id);
    setContextLabel(label);
    setContextPickerOpen(false);
    if (!subject) {
      setSubject(`Re: ${label}`);
    }
  };

  const clearContext = () => {
    setContextType(null);
    setContextId(undefined);
    setContextLabel(undefined);
  };

  const getContextIcon = (type: 'campaign' | 'order' | null) => {
    switch (type) {
      case 'campaign': return <Target className="h-4 w-4" />;
      case 'order': return <Package className="h-4 w-4" />;
      default: return <Link2 className="h-4 w-4" />;
    }
  };

  const toggleUser = (orgUser: OrgUser) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.user_id === orgUser.user_id);
      if (exists) {
        return prev.filter(u => u.user_id !== orgUser.user_id);
      }
      return [...prev, orgUser];
    });
  };

  const getUserName = (u: OrgUser) => {
    return `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown';
  };

  const getInitials = (u: OrgUser) => {
    return `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() || '?';
  };

  const getDonorName = (d: Donor) => {
    return `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Start a conversation with team members or donors
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internal" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Member
            </TabsTrigger>
            <TabsTrigger value="donor" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Donor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between h-auto min-h-10"
                  >
                    {selectedUsers.length === 0 ? (
                      <span className="text-muted-foreground">Select team members...</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedUsers.map(u => (
                          <Badge key={u.user_id} variant="secondary" className="flex items-center gap-1">
                            {getUserName(u)}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleUser(u);
                              }}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search team members..." />
                    <CommandList>
                      <CommandEmpty>No team members found.</CommandEmpty>
                      <CommandGroup>
                        {orgUsers.map(u => (
                          <CommandItem
                            key={u.user_id}
                            value={getUserName(u)}
                            onSelect={() => toggleUser(u)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUsers.some(s => s.user_id === u.user_id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{getInitials(u)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm">{getUserName(u)}</p>
                              <p className="text-xs text-muted-foreground">{u.user_type_name}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedUsers.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="subject">Subject (optional)</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Group conversation topic"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="donor" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Donor</Label>
              <Popover open={donorSearchOpen} onOpenChange={setDonorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedDonor ? getDonorName(selectedDonor) : "Select a donor..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search donors..." />
                    <CommandList>
                      <CommandEmpty>No donors found.</CommandEmpty>
                      <CommandGroup>
                        {donors.map(d => (
                          <CommandItem
                            key={d.id}
                            value={getDonorName(d)}
                            onSelect={() => {
                              setSelectedDonor(d);
                              setDonorSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDonor?.id === d.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex-1">
                              <p className="text-sm">{getDonorName(d)}</p>
                              <p className="text-xs text-muted-foreground">{d.email}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="donorSubject">Subject (optional)</Label>
              <Input
                id="donorSubject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Sponsorship Materials Request"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Context Linking */}
        {contextType && contextLabel ? (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Badge variant="secondary" className="flex items-center gap-1">
              {getContextIcon(contextType)}
              <span className="capitalize">{contextType}:</span>
              <span className="font-medium">{contextLabel}</span>
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={clearContext}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Collapsible open={contextSelectorOpen} onOpenChange={setContextSelectorOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Link2 className="h-4 w-4 mr-2" />
                Link to campaign or order (optional)
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label>Context Type</Label>
                <Popover open={contextPickerOpen} onOpenChange={setContextPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {contextType ? (
                        <span className="flex items-center gap-2">
                          {getContextIcon(contextType)}
                          <span className="capitalize">{contextType}</span>
                        </span>
                      ) : (
                        "Select context type..."
                      )}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandList>
                        <CommandGroup heading="Link to">
                          <CommandItem
                            onSelect={() => {
                              setContextType('campaign');
                              setContextPickerOpen(false);
                            }}
                          >
                            <Target className="h-4 w-4 mr-2" />
                            Campaign
                          </CommandItem>
                          <CommandItem
                            onSelect={() => {
                              setContextType('order');
                              setContextPickerOpen(false);
                            }}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Order
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {contextType === 'campaign' && (
                <div className="space-y-2">
                  <Label>Select Campaign</Label>
                  <Command className="border rounded-md">
                    <CommandInput placeholder="Search campaigns..." />
                    <CommandList>
                      <CommandEmpty>No campaigns found.</CommandEmpty>
                      <CommandGroup>
                        {campaigns.map(c => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => selectContext('campaign', c.id, c.name)}
                          >
                            <Target className="h-4 w-4 mr-2" />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}

              {contextType === 'order' && (
                <div className="space-y-2">
                  <Label>Select Order</Label>
                  <Command className="border rounded-md">
                    <CommandInput placeholder="Search orders..." />
                    <CommandList>
                      <CommandEmpty>No orders found.</CommandEmpty>
                      <CommandGroup>
                        {orders.map(o => (
                          <CommandItem
                            key={o.id}
                            value={`${o.donor_name} ${o.campaign_name}`}
                            onSelect={() => selectContext('order', o.id, `${o.donor_name} - ${o.campaign_name}`)}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            <div className="flex flex-col">
                              <span className="text-sm">{o.donor_name}</span>
                              <span className="text-xs text-muted-foreground">{o.campaign_name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateConversation} disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;