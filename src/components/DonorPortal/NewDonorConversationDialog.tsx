import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Send, MessageSquare } from "lucide-react";

interface DonorProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  organization_id: string;
}

interface Campaign {
  id: string;
  name: string;
  group_id: string;
  group_name: string;
  organization_id: string;
}

interface GroupLeader {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  user_type_name: string;
}

interface NewDonorConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorProfiles: DonorProfile[];
  onConversationCreated: (conversationId: string) => void;
}

export function NewDonorConversationDialog({
  open,
  onOpenChange,
  donorProfiles,
  onConversationCreated,
}: NewDonorConversationDialogProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groupLeaders, setGroupLeaders] = useState<GroupLeader[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [sending, setSending] = useState(false);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // Fetch campaigns the donor has purchased from
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!open || !user) return;

      setLoadingCampaigns(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            campaign_id,
            campaign:campaigns (
              id,
              name,
              group_id,
              group:groups (
                id,
                group_name,
                organization_id
              )
            )
          `)
          .eq('user_id', user.id)
          .in('status', ['succeeded', 'pending']);

        if (error) throw error;

        // Extract unique campaigns
        const uniqueCampaigns = new Map<string, Campaign>();
        for (const order of data || []) {
          const campaign = order.campaign as any;
          if (campaign && campaign.group && !uniqueCampaigns.has(campaign.id)) {
            uniqueCampaigns.set(campaign.id, {
              id: campaign.id,
              name: campaign.name,
              group_id: campaign.group.id,
              group_name: campaign.group.group_name,
              organization_id: campaign.group.organization_id,
            });
          }
        }

        setCampaigns(Array.from(uniqueCampaigns.values()));
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast.error("Failed to load campaigns");
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, [open, user]);

  // Fetch group leaders when a campaign is selected
  useEffect(() => {
    const fetchGroupLeaders = async () => {
      if (!selectedCampaignId) {
        setGroupLeaders([]);
        setSelectedLeaderId("");
        return;
      }

      const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
      if (!selectedCampaign) return;

      setLoadingLeaders(true);
      try {
        const { data, error } = await supabase
          .from('organization_user')
          .select(`
            id,
            user_id,
            profile:profiles (
              first_name,
              last_name,
              avatar_url
            ),
            user_type:user_type (
              name
            )
          `)
          .eq('group_id', selectedCampaign.group_id)
          .eq('active_user', true);

        if (error) throw error;

        // Filter to group leaders only
        const leaderTypes = ['Coach', 'Club Sponsor', 'Booster Leader', 'Program Director', 'Program Manager'];
        const leaders: GroupLeader[] = [];

        for (const ou of data || []) {
          const profile = ou.profile as any;
          const userType = ou.user_type as any;
          
          if (profile && userType && leaderTypes.includes(userType.name)) {
            leaders.push({
              id: ou.id,
              user_id: ou.user_id,
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              avatar_url: profile.avatar_url,
              user_type_name: userType.name,
            });
          }
        }

        setGroupLeaders(leaders);
      } catch (error) {
        console.error('Error fetching group leaders:', error);
        toast.error("Failed to load group leaders");
      } finally {
        setLoadingLeaders(false);
      }
    };

    fetchGroupLeaders();
  }, [selectedCampaignId, campaigns]);

  const handleSend = async () => {
    if (!selectedCampaignId || !selectedLeaderId || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
    const selectedLeader = groupLeaders.find(l => l.id === selectedLeaderId);
    const donorProfile = donorProfiles.find(p => p.organization_id === selectedCampaign?.organization_id) || donorProfiles[0];

    if (!selectedCampaign || !selectedLeader || !donorProfile) {
      toast.error("Invalid selection");
      return;
    }

    setSending(true);
    try {
      // Create the conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          organization_id: selectedCampaign.organization_id,
          conversation_type: 'campaign',
          context_type: 'campaign',
          context_id: selectedCampaign.id,
          subject: subject.trim() || `Message about ${selectedCampaign.name}`,
          created_by: null, // Donors don't have user profiles in the org
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add the donor as a participant
      const { error: donorParticipantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          participant_type: 'donor',
          donor_profile_id: donorProfile.id,
          role: 'participant',
        });

      if (donorParticipantError) throw donorParticipantError;

      // Add the staff member as a participant
      const { error: staffParticipantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          participant_type: 'staff',
          user_id: selectedLeader.user_id,
          role: 'admin',
        });

      if (staffParticipantError) throw staffParticipantError;

      // Insert the initial message
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversation.id,
          sender_donor_profile_id: donorProfile.id,
          sender_type: 'donor',
          content: message.trim(),
        }])
        .select()
        .single();

      if (messageError) throw messageError;

      // Trigger notification
      try {
        await supabase.functions.invoke('send-message-notification', {
          body: {
            conversationId: conversation.id,
            messageId: newMessage.id,
          },
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the whole operation for notification failure
      }

      toast.success("Message sent successfully!");
      onOpenChange(false);
      resetForm();
      onConversationCreated(conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSelectedCampaignId("");
    setSelectedLeaderId("");
    setSubject("");
    setMessage("");
    setGroupLeaders([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const selectedLeader = groupLeaders.find(l => l.id === selectedLeaderId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            New Message
          </DialogTitle>
          <DialogDescription>
            Send a message to a group leader from a campaign you've supported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campaign Selector */}
          <div className="space-y-2">
            <Label htmlFor="campaign">Campaign *</Label>
            {loadingCampaigns ? (
              <Skeleton className="h-10 w-full" />
            ) : campaigns.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                You haven't made any purchases yet. Complete a purchase to message group leaders.
              </div>
            ) : (
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger id="campaign">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      <div className="flex flex-col">
                        <span>{campaign.name}</span>
                        <span className="text-xs text-muted-foreground">{campaign.group_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Recipient Selector */}
          {selectedCampaignId && (
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient *</Label>
              {loadingLeaders ? (
                <Skeleton className="h-10 w-full" />
              ) : groupLeaders.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  No group leaders available for this campaign.
                </div>
              ) : (
                <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
                  <SelectTrigger id="recipient">
                    <SelectValue placeholder="Select a recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupLeaders.map((leader) => (
                      <SelectItem key={leader.id} value={leader.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={leader.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {leader.first_name?.[0]}{leader.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{leader.first_name} {leader.last_name}</span>
                          <span className="text-xs text-muted-foreground">({leader.user_type_name})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Subject */}
          {selectedLeaderId && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject..."
              />
            </div>
          )}

          {/* Message */}
          {selectedLeaderId && (
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedCampaignId || !selectedLeaderId || !message.trim() || sending}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
