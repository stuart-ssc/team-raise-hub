import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Play, Pause, Mail, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { BusinessCampaignDialog } from "@/components/BusinessCampaignDialog";
import { ManualEnrollmentDialog } from "@/components/ManualEnrollmentDialog";

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  status: string;
  created_at: string;
  trigger_config: any;
}

export default function BusinessNurtureCampaigns() {
  const { organizationUser } = useOrganizationUser();
  const organizationId = organizationUser?.organization_id;
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [enrollmentCampaignId, setEnrollmentCampaignId] = useState<string>("");

  useEffect(() => {
    if (organizationId) {
      fetchCampaigns();
    }
  }, [organizationId]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("business_nurture_campaigns")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCampaigns(data || []);

      // Fetch stats for each campaign
      const campaignStats: Record<string, any> = {};
      for (const campaign of data || []) {
        const { data: enrollments } = await supabase
          .from("business_nurture_enrollments")
          .select("id, status")
          .eq("campaign_id", campaign.id);

        const activeCount = enrollments?.filter(e => e.status === "active").length || 0;
        const completedCount = enrollments?.filter(e => e.status === "completed").length || 0;

        campaignStats[campaign.id] = {
          total: enrollments?.length || 0,
          active: activeCount,
          completed: completedCount,
        };
      }
      setStats(campaignStats);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "paused" : "active";
      const { error } = await supabase
        .from("business_nurture_campaigns")
        .update({ status: newStatus })
        .eq("id", campaignId);

      if (error) throw error;

      toast.success(`Campaign ${newStatus === "active" ? "activated" : "paused"}`);
      fetchCampaigns();
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Failed to update campaign");
    }
  };

  const getCampaignTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      health_check: "Health Check",
      expansion: "Expansion",
      at_risk: "At Risk",
      re_engagement: "Re-engagement",
    };
    return labels[type] || type;
  };

  const getCampaignTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      health_check: "bg-green-500/10 text-green-700 border-green-500/20",
      expansion: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      at_risk: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      re_engagement: "bg-red-500/10 text-red-700 border-red-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-700 border-gray-500/20";
  };

  const handleCreateCampaign = () => {
    setSelectedCampaign(null);
    setDialogOpen(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardPageLayout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Business Nurture Campaigns</h1>
          <p className="text-muted-foreground">Automated email campaigns for business outreach</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Nurture Campaigns</h1>
          <p className="text-muted-foreground">Automated email campaigns for business partnership cultivation</p>
        </div>
        <Button onClick={handleCreateCampaign}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>
      {campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first automated outreach campaign to cultivate business partnerships
          </p>
          <Button onClick={handleCreateCampaign}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Campaign
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{campaign.name}</h3>
                    <Badge
                      variant="outline"
                      className={getCampaignTypeColor(campaign.campaign_type)}
                    >
                      {getCampaignTypeLabel(campaign.campaign_type)}
                    </Badge>
                    <Badge
                      variant={campaign.status === "active" ? "default" : "secondary"}
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(campaign.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                  >
                    {campaign.status === "active" ? (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCampaign(campaign)}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              {stats[campaign.id] && (
                <>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats[campaign.id].total}</p>
                        <p className="text-xs text-muted-foreground">Total Enrolled</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats[campaign.id].active}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats[campaign.id].completed}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEnrollmentCampaignId(campaign.id);
                        setEnrollmentOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Matching
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      <BusinessCampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaign={selectedCampaign}
        organizationId={organizationId}
        onSuccess={() => {
          fetchCampaigns();
          setDialogOpen(false);
        }}
      />

      <ManualEnrollmentDialog
        open={enrollmentOpen}
        onOpenChange={setEnrollmentOpen}
        organizationId={organizationId}
        preSelectedBusinessIds={[]}
        onSuccess={() => {
          fetchCampaigns();
        }}
      />
    </DashboardPageLayout>
  );
}
