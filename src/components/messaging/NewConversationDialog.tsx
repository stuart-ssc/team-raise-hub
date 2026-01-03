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
import { Check, ChevronsUpDown, X, Users, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
  preselectedUserId?: string;
  preselectedDonorId?: string;
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
  preselectedDonorId
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

  useEffect(() => {
    if (open && organizationUser?.organization_id) {
      fetchOrgUsers();
      fetchDonors();
    }
  }, [open, organizationUser?.organization_id]);

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
        profiles:user_id (
          first_name,
          last_name,
          avatar_url
        ),
        user_type:user_type_id (
          name
        )
      `)
      .eq('organization_id', organizationUser.organization_id)
      .eq('active_user', true)
      .neq('user_id', user?.id);

    if (!error && data) {
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
          created_by: user.id
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
    onOpenChange(false);
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