import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { Loader2, Users, TrendingUp, Send, Filter, RefreshCw, Award, AlertCircle, Heart, List, Plus, Trash2, Pencil, Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import DonorListDetail from "@/components/DonorListDetail";
import ContactFundraiserDialog from "@/components/ContactFundraiserDialog";

interface DonorSegment {
  id: string;
  name: string;
  description: string;
  filters: any;
  created_at: string;
  donor_count?: number;
}

interface SegmentStats {
  segment: string;
  count: number;
  avgLifetimeValue: number;
  avgDonationCount: number;
  color: string;
  icon: any;
  description: string;
}

const SEGMENT_INFO: Record<string, { color: string; icon: any; description: string }> = {
  champions: { color: "bg-yellow-500", icon: Award, description: "Best customers: frequent, recent, high value" },
  loyal: { color: "bg-blue-500", icon: Heart, description: "Consistent supporters with strong engagement" },
  big_spenders: { color: "bg-purple-500", icon: TrendingUp, description: "High value donors, less frequent" },
  promising: { color: "bg-green-500", icon: Users, description: "Recent donors with potential" },
  needs_attention: { color: "bg-orange-500", icon: AlertCircle, description: "Above average but declining" },
  at_risk: { color: "bg-red-500", icon: AlertCircle, description: "Was good, now slipping away" },
  lost: { color: "bg-gray-500", icon: AlertCircle, description: "Long time since last donation" },
  new: { color: "bg-teal-500", icon: Users, description: "New or one-time donors" },
};

export default function DonorSegmentation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizationUser, loading: organizationUserLoading } = useOrganizationUser();
  const { activeGroup } = useActiveGroup();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "lists" ? "lists" : "overview";
  
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [segments, setSegments] = useState<DonorSegment[]>([]);
  const [segmentStats, setSegmentStats] = useState<SegmentStats[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");
  
  // Lists state
  const [lists, setLists] = useState<{ id: string; name: string; description: string | null; member_count: number; created_at: string }[]>([]);
  const [createListDialogOpen, setCreateListDialogOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedListName, setSelectedListName] = useState("");
  const [listDetailOpen, setListDetailOpen] = useState(false);
  const [listCampaignDialogOpen, setListCampaignDialogOpen] = useState(false);
  const [selectedListIdForCampaign, setSelectedListIdForCampaign] = useState<string>("");
  const [contactFundraiserListId, setContactFundraiserListId] = useState<string | null>(null);
  const [contactFundraiserOpen, setContactFundraiserOpen] = useState(false);
  
  // Form states
  const [segmentName, setSegmentName] = useState("");
  const [segmentDescription, setSegmentDescription] = useState("");
  const [selectedRfmSegments, setSelectedRfmSegments] = useState<string[]>([]);
  const [minLifetimeValue, setMinLifetimeValue] = useState("");
  const [maxLifetimeValue, setMaxLifetimeValue] = useState("");
  const [minDonationCount, setMinDonationCount] = useState("");
  const [maxDonationCount, setMaxDonationCount] = useState("");
  
  // Campaign form states
  const [campaignName, setCampaignName] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchData(activeGroup?.id);
    }
  }, [organizationUser?.organization_id, activeGroup?.id]);

  const fetchData = async (groupId?: string | null) => {
    try {
      setLoading(true);
      await Promise.all([fetchSegments(), fetchSegmentStats(groupId), fetchLists()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load segmentation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSegments = async () => {
    const { data, error } = await supabase
      .from("donor_segments")
      .select("*")
      .eq("organization_id", organizationUser?.organization_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setSegments(data || []);
  };

  const fetchSegmentStats = async (groupId?: string | null) => {
    let donorData;

    if (groupId) {
      // Filter donors by group
      const { data: donorEmails } = await supabase
        .from("orders")
        .select("customer_email, campaigns!inner(group_id)")
        .eq("campaigns.group_id", groupId)
        .not("customer_email", "is", null);

      const uniqueEmails = [...new Set(donorEmails?.map(o => o.customer_email) || [])];
      
      if (uniqueEmails.length === 0) {
        setSegmentStats([]);
        return;
      }

      const { data, error } = await supabase
        .from("donor_profiles")
        .select("rfm_segment, lifetime_value, donation_count")
        .eq("organization_id", organizationUser?.organization_id)
        .in("email", uniqueEmails);

      if (error) throw error;
      donorData = data;
    } else {
      const { data, error } = await supabase
        .from("donor_profiles")
        .select("rfm_segment, lifetime_value, donation_count")
        .eq("organization_id", organizationUser?.organization_id);

      if (error) throw error;
      donorData = data;
    }

    const stats = Object.keys(SEGMENT_INFO).map(segment => {
      const donors = donorData.filter(d => d.rfm_segment === segment);
      const info = SEGMENT_INFO[segment];
      
      return {
        segment,
        count: donors.length,
        avgLifetimeValue: donors.length > 0 
          ? donors.reduce((sum, d) => sum + (d.lifetime_value || 0), 0) / donors.length 
          : 0,
        avgDonationCount: donors.length > 0
          ? donors.reduce((sum, d) => sum + (d.donation_count || 0), 0) / donors.length
          : 0,
        ...info
      };
    });

    setSegmentStats(stats.sort((a, b) => b.count - a.count));
  };
  const fetchLists = async () => {
    const { data, error } = await supabase
      .from("donor_lists")
      .select("id, name, description, created_at")
      .eq("organization_id", organizationUser?.organization_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const listsWithCounts = [];
    for (const list of data || []) {
      const { count } = await supabase
        .from("donor_list_members")
        .select("id", { count: "exact", head: true })
        .eq("list_id", list.id);
      listsWithCounts.push({ ...list, member_count: count || 0 });
    }
    setLists(listsWithCounts);
  };

  const handleCreateList = async () => {
    try {
      const { error } = await supabase.from("donor_lists").insert({
        organization_id: organizationUser?.organization_id,
        name: listName,
        description: listDescription || null,
        created_by: organizationUser?.user_id,
      });

      if (error) throw error;

      toast({ title: "Success", description: "List created" });
      setCreateListDialogOpen(false);
      setListName("");
      setListDescription("");
      await fetchLists();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const { error } = await supabase.from("donor_lists").delete().eq("id", listId);
      if (error) throw error;
      toast({ title: "List deleted" });
      await fetchLists();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSendListCampaign = async () => {
    try {
      setSending(true);
      const { data, error } = await supabase.functions.invoke("send-segmented-campaign", {
        body: { listId: selectedListIdForCampaign, campaignName, subjectLine, emailContent },
      });
      if (error) throw error;
      toast({ title: "Success", description: `Campaign sent to ${data.successfulDeliveries} donors` });
      setListCampaignDialogOpen(false);
      resetCampaignForm();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to send campaign", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleCalculateRFM = async () => {
    try {
      setCalculating(true);
      
      const { data, error } = await supabase.functions.invoke('calculate-rfm-scores', {
        body: { organizationId: organizationUser?.organization_id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `RFM scores calculated for ${data.totalDonors} donors`,
      });

      await fetchSegmentStats();
    } catch (error) {
      console.error("Error calculating RFM:", error);
      toast({
        title: "Error",
        description: "Failed to calculate RFM scores",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleCreateSegment = async () => {
    try {
      const filters: any = {};
      
      if (selectedRfmSegments.length > 0) {
        filters.rfm_segment = selectedRfmSegments;
      }
      
      if (minLifetimeValue || maxLifetimeValue) {
        filters.lifetime_value = {};
        if (minLifetimeValue) filters.lifetime_value.min = parseInt(minLifetimeValue) * 100;
        if (maxLifetimeValue) filters.lifetime_value.max = parseInt(maxLifetimeValue) * 100;
      }
      
      if (minDonationCount || maxDonationCount) {
        filters.donation_count = {};
        if (minDonationCount) filters.donation_count.min = parseInt(minDonationCount);
        if (maxDonationCount) filters.donation_count.max = parseInt(maxDonationCount);
      }

      const { error } = await supabase
        .from("donor_segments")
        .insert({
          organization_id: organizationUser?.organization_id,
          name: segmentName,
          description: segmentDescription,
          filters
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Segment created successfully",
      });

      setCreateDialogOpen(false);
      resetForm();
      await fetchSegments();
    } catch (error) {
      console.error("Error creating segment:", error);
      toast({
        title: "Error",
        description: "Failed to create segment",
        variant: "destructive",
      });
    }
  };

  const handleSendCampaign = async () => {
    try {
      setSending(true);

      const { data, error } = await supabase.functions.invoke('send-segmented-campaign', {
        body: {
          segmentId: selectedSegmentId,
          campaignName,
          subjectLine,
          emailContent
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Campaign sent to ${data.successfulDeliveries} donors`,
      });

      setCampaignDialogOpen(false);
      resetCampaignForm();
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSegmentName("");
    setSegmentDescription("");
    setSelectedRfmSegments([]);
    setMinLifetimeValue("");
    setMaxLifetimeValue("");
    setMinDonationCount("");
    setMaxDonationCount("");
  };

  const resetCampaignForm = () => {
    setCampaignName("");
    setSubjectLine("");
    setEmailContent("");
    setSelectedSegmentId("");
  };

  if (organizationUserLoading || loading) {
    return (
      <DashboardPageLayout segments={[{ label: "Donors", path: "/dashboard/donors" }, { label: "Segmentation" }]} loading={true}>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <>
      <DashboardPageLayout segments={[{ label: "Donors", path: "/dashboard/donors" }, { label: "Segmentation" }]}>
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Donor Segmentation</h1>
                <p className="text-muted-foreground mt-1">
                  Group donors by giving patterns and send targeted campaigns
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCalculateRFM} disabled={calculating} variant="outline">
                  {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Calculate RFM
                </Button>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Filter className="mr-2 h-4 w-4" />
                      Create Segment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Custom Segment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="segmentName">Segment Name</Label>
                        <Input
                          id="segmentName"
                          value={segmentName}
                          onChange={(e) => setSegmentName(e.target.value)}
                          placeholder="e.g., Major Donors 2024"
                        />
                      </div>
                      <div>
                        <Label htmlFor="segmentDescription">Description</Label>
                        <Textarea
                          id="segmentDescription"
                          value={segmentDescription}
                          onChange={(e) => setSegmentDescription(e.target.value)}
                          placeholder="Describe this segment..."
                        />
                      </div>
                      <div>
                        <Label>RFM Segments</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {Object.keys(SEGMENT_INFO).map(segment => (
                            <label key={segment} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRfmSegments.includes(segment)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRfmSegments([...selectedRfmSegments, segment]);
                                  } else {
                                    setSelectedRfmSegments(selectedRfmSegments.filter(s => s !== segment));
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm capitalize">{segment.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minLifetime">Min Lifetime Value ($)</Label>
                          <Input
                            id="minLifetime"
                            type="number"
                            value={minLifetimeValue}
                            onChange={(e) => setMinLifetimeValue(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxLifetime">Max Lifetime Value ($)</Label>
                          <Input
                            id="maxLifetime"
                            type="number"
                            value={maxLifetimeValue}
                            onChange={(e) => setMaxLifetimeValue(e.target.value)}
                            placeholder="No limit"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minDonations">Min Donation Count</Label>
                          <Input
                            id="minDonations"
                            type="number"
                            value={minDonationCount}
                            onChange={(e) => setMinDonationCount(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxDonations">Max Donation Count</Label>
                          <Input
                            id="maxDonations"
                            type="number"
                            value={maxDonationCount}
                            onChange={(e) => setMaxDonationCount(e.target.value)}
                            placeholder="No limit"
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreateSegment} className="w-full">
                        Create Segment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs defaultValue={initialTab} className="w-full">
              <TabsList>
                <TabsTrigger value="overview">RFM Overview</TabsTrigger>
                <TabsTrigger value="segments">Custom Segments</TabsTrigger>
                <TabsTrigger value="lists">Lists</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {segmentStats.map(stat => {
                    const Icon = stat.icon;
                    return (
                      <Card key={stat.segment} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                              <h3 className="font-semibold capitalize text-foreground">
                                {stat.segment.replace('_', ' ')}
                              </h3>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                            <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                            <div className="mt-3 space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Avg. Lifetime: ${stat.avgLifetimeValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Avg. Donations: {stat.avgDonationCount.toFixed(1)}
                              </p>
                            </div>
                          </div>
                          <Icon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="segments" className="space-y-4">
                {segments.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Custom Segments Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create custom segments to organize donors and send targeted campaigns
                    </p>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      Create Your First Segment
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.map(segment => (
                      <Card key={segment.id} className="p-6">
                        <h3 className="font-semibold text-foreground mb-2">{segment.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{segment.description}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSegmentId(segment.id);
                              setCampaignDialogOpen(true);
                            }}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send Campaign
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="lists" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setCreateListDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create List
                  </Button>
                </div>

                {lists.length === 0 ? (
                  <Card className="p-12 text-center">
                    <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Lists Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a list to manually curate a group of donors for targeted outreach
                    </p>
                    <Button onClick={() => setCreateListDialogOpen(true)}>
                      Create Your First List
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lists.map((list) => (
                      <Card key={list.id} className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{list.name}</h3>
                          <Badge variant="secondary">
                            <Users className="h-3 w-3 mr-1" />
                            {list.member_count}
                          </Badge>
                        </div>
                        {list.description && (
                          <p className="text-sm text-muted-foreground mb-4">{list.description}</p>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedListId(list.id);
                              setSelectedListName(list.name);
                              setListDetailOpen(true);
                            }}
                          >
                            <Pencil className="mr-1 h-3 w-3" />
                            View/Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedListIdForCampaign(list.id);
                              setListCampaignDialogOpen(true);
                            }}
                            disabled={list.member_count === 0}
                          >
                            <Send className="mr-1 h-3 w-3" />
                            Send Campaign
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setContactFundraiserListId(list.id);
                              setContactFundraiserOpen(true);
                            }}
                            disabled={list.member_count === 0}
                          >
                            <Megaphone className="mr-1 h-3 w-3" />
                            Contact about Fundraiser
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteList(list.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
        </div>
      </DashboardPageLayout>

      {/* Create List Dialog */}
      <Dialog open={createListDialogOpen} onOpenChange={setCreateListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g., Gala Invitees 2026"
              />
            </div>
            <div>
              <Label htmlFor="listDescription">Description (optional)</Label>
              <Textarea
                id="listDescription"
                value={listDescription}
                onChange={(e) => setListDescription(e.target.value)}
                placeholder="What is this list for?"
              />
            </div>
            <Button onClick={handleCreateList} disabled={!listName.trim()} className="w-full">
              Create List
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* List Detail Dialog */}
      {selectedListId && (
        <DonorListDetail
          open={listDetailOpen}
          onOpenChange={setListDetailOpen}
          listId={selectedListId}
          listName={selectedListName}
          onMembersChanged={() => fetchLists()}
        />
      )}

      {/* Send List Campaign Dialog */}
      <Dialog open={listCampaignDialogOpen} onOpenChange={setListCampaignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Campaign to List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="listCampaignName">Campaign Name</Label>
              <Input
                id="listCampaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Spring Appeal 2026"
              />
            </div>
            <div>
              <Label htmlFor="listSubjectLine">Subject Line</Label>
              <Input
                id="listSubjectLine"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                placeholder="e.g., You're invited to support us!"
              />
            </div>
            <div>
              <Label htmlFor="listEmailContent">Email Content (HTML)</Label>
              <Textarea
                id="listEmailContent"
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Use {firstName}, {lastName}, {lifetimeValue}, {donationCount}, {segment} for personalization"
                rows={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available variables: {"{firstName}"}, {"{lastName}"}, {"{lifetimeValue}"}, {"{donationCount}"}, {"{segment}"}
              </p>
            </div>
            <Button onClick={handleSendListCampaign} disabled={sending} className="w-full">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

        {/* Send Segment Campaign Dialog */}
        <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Segmented Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Year-End Appeal 2024"
              />
            </div>
            <div>
              <Label htmlFor="subjectLine">Subject Line</Label>
              <Input
                id="subjectLine"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                placeholder="e.g., Thank you for your incredible support!"
              />
            </div>
            <div>
              <Label htmlFor="emailContent">Email Content (HTML)</Label>
              <Textarea
                id="emailContent"
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Use {firstName}, {lastName}, {lifetimeValue}, {donationCount}, {segment} for personalization"
                rows={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available variables: {"{firstName}"}, {"{lastName}"}, {"{lifetimeValue}"}, {"{donationCount}"}, {"{segment}"}
              </p>
            </div>
            <Button onClick={handleSendCampaign} disabled={sending} className="w-full">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
