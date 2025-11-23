import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Play, Pause, Mail, Users, TrendingUp, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmailEditorDialog } from "@/components/EmailEditor/EmailEditorDialog";

interface NurtureCampaign {
  id: string;
  name: string;
  description: string;
  campaign_type: string;
  trigger_config: any;
  status: string;
  created_at: string;
}

interface NurtureSequence {
  id: string;
  campaign_id: string;
  sequence_order: number;
  subject_line: string;
  email_content: string;
  delay_hours: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  campaign_type: string;
  sequence_order: number;
  subject_line: string;
  email_content: string;
  recommended_delay_hours: number;
}

export default function NurtureCampaigns() {
  const queryClient = useQueryClient();
  const { organizationUser } = useOrganizationUser();
  const organizationId = organizationUser?.organization_id;
  const isMobile = useIsMobile();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<NurtureCampaign | null>(null);
  const [sequenceDialogOpen, setSequenceDialogOpen] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    campaign_type: "welcome",
    trigger_config: {},
  });

  const [newSequence, setNewSequence] = useState({
    sequence_order: 1,
    subject_line: "",
    email_content: "",
    delay_hours: 0,
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [visualEditorOpen, setVisualEditorOpen] = useState(false);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["nurture-campaigns", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nurture_campaigns")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as NurtureCampaign[];
    },
    enabled: !!organizationId,
  });

  const { data: sequences } = useQuery({
    queryKey: ["nurture-sequences", selectedCampaign?.id],
    queryFn: async () => {
      if (!selectedCampaign) return [];
      const { data, error } = await supabase
        .from("nurture_sequences")
        .select("*")
        .eq("campaign_id", selectedCampaign.id)
        .order("sequence_order", { ascending: true });
      
      if (error) throw error;
      return data as NurtureSequence[];
    },
    enabled: !!selectedCampaign,
  });

  const { data: enrollmentStats } = useQuery({
    queryKey: ["nurture-stats", selectedCampaign?.id],
    queryFn: async () => {
      if (!selectedCampaign) return null;
      const { data, error } = await supabase
        .from("nurture_enrollments")
        .select("status")
        .eq("campaign_id", selectedCampaign.id);
      
      if (error) throw error;
      
      return {
        total: data.length,
        active: data.filter((e) => e.status === "active").length,
        completed: data.filter((e) => e.status === "completed").length,
      };
    },
    enabled: !!selectedCampaign,
  });

  const { data: emailTemplates } = useQuery({
    queryKey: ["email-templates", selectedCampaign?.campaign_type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("campaign_type", selectedCampaign?.campaign_type || "custom")
        .order("sequence_order", { ascending: true });
      
      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: !!selectedCampaign && sequenceDialogOpen,
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates?.find(t => t.id === templateId);
    if (template) {
      setNewSequence({
        sequence_order: sequences ? sequences.length + 1 : 1,
        subject_line: template.subject_line,
        email_content: template.email_content,
        delay_hours: template.recommended_delay_hours,
      });
      setSelectedTemplateId(templateId);
    }
  };

  const handleResetSequenceForm = () => {
    setNewSequence({
      sequence_order: sequences ? sequences.length + 1 : 1,
      subject_line: "",
      email_content: "",
      delay_hours: 0,
    });
    setSelectedTemplateId("");
  };

  const handleVisualEditorSave = (subject: string, htmlContent: string) => {
    setNewSequence({
      ...newSequence,
      subject_line: subject,
      email_content: htmlContent,
    });
    setVisualEditorOpen(false);
    toast.success("Email loaded from visual editor");
  };

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("nurture_campaigns")
        .insert({
          ...newCampaign,
          organization_id: organizationId,
          created_by: profile.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nurture-campaigns"] });
      setCreateDialogOpen(false);
      toast.success("Campaign created successfully");
      setNewCampaign({ name: "", description: "", campaign_type: "welcome", trigger_config: {} });
    },
    onError: (error) => {
      toast.error("Failed to create campaign: " + error.message);
    },
  });

  const addSequenceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("nurture_sequences")
        .insert({
          ...newSequence,
          campaign_id: selectedCampaign?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nurture-sequences"] });
      setSequenceDialogOpen(false);
      toast.success("Email sequence added");
      handleResetSequenceForm();
    },
    onError: (error) => {
      toast.error("Failed to add sequence: " + error.message);
    },
  });

  const toggleCampaignStatus = useMutation({
    mutationFn: async (campaign: NurtureCampaign) => {
      const newStatus = campaign.status === "active" ? "paused" : "active";
      const { error } = await supabase
        .from("nurture_campaigns")
        .update({ status: newStatus })
        .eq("id", campaign.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nurture-campaigns"] });
      toast.success("Campaign status updated");
    },
  });

  const getCampaignTypeLabel = (type: string) => {
    switch (type) {
      case "welcome": return "Welcome Series";
      case "reengagement": return "Re-engagement";
      case "milestone": return "Milestone";
      case "custom": return "Custom";
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "outline",
      active: "default",
      paused: "secondary",
      completed: "secondary",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar />
      
      <div className={`flex-1 flex flex-col ${isMobile ? 'pl-16' : ''}`}>
        <DashboardHeader onGroupClick={() => {}} activeGroup={null} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Nurture Campaigns</h1>
              <p className="text-muted-foreground">
                Automate donor engagement with email sequences
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Nurture Campaign</DialogTitle>
              <DialogDescription>
                Set up an automated email sequence to engage donors
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Welcome New Donors"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Describe the purpose of this campaign"
                />
              </div>
              <div>
                <Label>Campaign Type</Label>
                <Select
                  value={newCampaign.campaign_type}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, campaign_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Series</SelectItem>
                    <SelectItem value="reengagement">Re-engagement</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newCampaign.campaign_type === "reengagement" && (
                <div>
                  <Label>Inactivity Days</Label>
                  <Input
                    type="number"
                    placeholder="90"
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        trigger_config: { inactivity_days: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              )}
              <Button onClick={() => createCampaignMutation.mutate()} className="w-full">
                Create Campaign
              </Button>
            </div>
          </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
        <div className="text-center py-12">Loading campaigns...</div>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedCampaign(campaign)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>{getCampaignTypeLabel(campaign.campaign_type)}</CardDescription>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCampaignStatus.mutate(campaign);
                  }}
                >
                  {campaign.status === "active" ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first nurture campaign to start engaging donors automatically
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.name}</DialogTitle>
            <DialogDescription>{selectedCampaign?.description}</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="sequences">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sequences">Email Sequences</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sequences" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Email Sequences</h3>
                <Dialog open={sequenceDialogOpen} onOpenChange={(open) => {
                  setSequenceDialogOpen(open);
                  if (!open) handleResetSequenceForm();
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Email
                    </Button>
                  </DialogTrigger>
                   <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Email Sequence</DialogTitle>
                      <DialogDescription>
                        Start with a pre-built template or create your own from scratch
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Template Selector */}
                      {/* Visual Editor Button */}
                      <div>
                        <Label>Build Email</Label>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setVisualEditorOpen(true)}
                        >
                          Open Visual Email Editor
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Build your email with drag-and-drop components
                        </p>
                      </div>

                      {/* Template Selector */}
                      {emailTemplates && emailTemplates.length > 0 && (
                        <div>
                          <Label>Or Choose a Template</Label>
                          <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="Start from scratch or select a template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Start from scratch</SelectItem>
                              {emailTemplates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name} - {template.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedTemplateId && selectedTemplateId !== "none" && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Template loaded! You can customize it below before adding.
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <Label>Sequence Order</Label>
                        <Input
                          type="number"
                          value={newSequence.sequence_order}
                          onChange={(e) => setNewSequence({ ...newSequence, sequence_order: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Subject Line</Label>
                        <Input
                          value={newSequence.subject_line}
                          onChange={(e) => setNewSequence({ ...newSequence, subject_line: e.target.value })}
                          placeholder="Welcome to our community!"
                        />
                      </div>
                      <div>
                        <Label>Email Content (HTML)</Label>
                        <Textarea
                          value={newSequence.email_content}
                          onChange={(e) => setNewSequence({ ...newSequence, email_content: e.target.value })}
                          placeholder="Use placeholders: {firstName}, {lastName}, {lifetimeValue}, {donationCount}, {donationAmount}, {organizationName}, {campaignName}"
                          rows={10}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Available placeholders: {"{firstName}"}, {"{lastName}"}, {"{lifetimeValue}"}, {"{donationCount}"}, {"{donationAmount}"}, {"{organizationName}"}, {"{campaignName}"}
                        </p>
                      </div>
                      <div>
                        <Label>Delay (hours)</Label>
                        <Input
                          type="number"
                          value={newSequence.delay_hours}
                          onChange={(e) => setNewSequence({ ...newSequence, delay_hours: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          0 = immediate, 24 = 1 day, 72 = 3 days, 168 = 1 week
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => addSequenceMutation.mutate()} 
                          className="flex-1"
                          disabled={!newSequence.subject_line || !newSequence.email_content}
                        >
                          Add Sequence
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleResetSequenceForm}
                          type="button"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {sequences && sequences.length > 0 ? (
                <div className="space-y-3">
                  {sequences.map((seq) => (
                    <Card key={seq.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">Email {seq.sequence_order}</CardTitle>
                            <CardDescription>{seq.subject_line}</CardDescription>
                          </div>
                          <Badge variant="outline">
                            <Clock className="mr-1 h-3 w-3" />
                            {seq.delay_hours}h
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {seq.email_content.replace(/<[^>]*>/g, '')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No email sequences yet. Add your first email to get started.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{enrollmentStats?.total || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{enrollmentStats?.active || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{enrollmentStats?.completed || 0}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Visual Email Editor */}
      <EmailEditorDialog
        open={visualEditorOpen}
        onOpenChange={setVisualEditorOpen}
        initialSubject={newSequence.subject_line}
        initialContent={newSequence.email_content}
        onSave={handleVisualEditorSave}
      />
        </main>
      </div>
    </div>
  );
}
