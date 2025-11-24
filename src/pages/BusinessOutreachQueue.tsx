import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, TrendingUp, AlertTriangle, DollarSign, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { BusinessContactsList } from "@/components/BusinessContactsList";
import {
  BusinessOutreachQueueItem,
  getHealthStatusInfo,
  getPriorityBadgeColor,
  getContactTarget,
  markBusinessContacted,
  getExpansionPotentialInfo
} from "@/lib/businessOutreach";

export default function BusinessOutreachQueue() {
  const navigate = useNavigate();
  const { organizationUser } = useOrganizationUser();
  const organizationId = organizationUser?.organization_id;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>("priority");
  const [filterHealth, setFilterHealth] = useState<string>("all");
  const [filterPotential, setFilterPotential] = useState<string>("all");

  useEffect(() => {
    if (organizationId) {
      fetchQueue();
    }
  }, [organizationId]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_outreach_queue')
        .select(`
          *,
          businesses!inner(
            id,
            business_name,
            industry,
            city,
            state,
            business_email
          )
        `)
        .eq('organization_id', organizationId)
        .is('actioned_at', null)
        .order('priority_score', { ascending: false });

      if (error) throw error;

      // Fetch linked contacts for each business
      const itemsWithContacts = await Promise.all(
        (data || []).map(async (item) => {
          const { data: contacts } = await supabase
            .from('business_donors')
            .select(`
              donor_id,
              role,
              is_primary_contact,
              donor_profiles!inner(id, first_name, last_name, email, phone)
            `)
            .eq('business_id', item.businesses.id)
            .is('blocked_at', null);

          return {
            ...item,
            contacts: contacts || []
          };
        })
      );

      setQueueItems(itemsWithContacts);
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast.error('Failed to load outreach queue');
    } finally {
      setLoading(false);
    }
  };

  const generateQueue = async () => {
    try {
      setGenerating(true);
      const { data, error } = await supabase.functions.invoke('generate-business-outreach-queue', {
        body: { organizationId }
      });

      if (error) throw error;

      toast.success(`Queue generated: ${data.summary.processed} businesses processed`);
      fetchQueue();
    } catch (error) {
      console.error('Error generating queue:', error);
      toast.error('Failed to generate queue');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkContacted = async (queueItemId: string, businessId: string) => {
    const success = await markBusinessContacted(queueItemId, businessId);
    if (success) {
      fetchQueue();
    }
  };

  // Apply filters and sorting
  const filteredItems = queueItems
    .filter(item => {
      if (filterHealth !== 'all' && item.partnership_health_status !== filterHealth) return false;
      if (filterPotential !== 'all' && item.expansion_potential_level !== filterPotential) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority_score - a.priority_score;
        case 'date':
          return new Date(a.recommended_outreach_date).getTime() - new Date(b.recommended_outreach_date).getTime();
        case 'value':
          return (b.queue_insights?.metrics?.total_partnership_value || 0) - (a.queue_insights?.metrics?.total_partnership_value || 0);
        case 'activity':
          return (a.queue_insights?.metrics?.days_since_last_activity || 9999) - (b.queue_insights?.metrics?.days_since_last_activity || 9999);
        default:
          return 0;
      }
    });

  // Calculate statistics
  const stats = {
    total: queueItems.length,
    highPriority: queueItems.filter(item => item.priority_score >= 80).length,
    critical: queueItems.filter(item => ['at_risk', 'critical'].includes(item.partnership_health_status)).length,
    totalValue: queueItems.reduce((sum, item) => sum + (item.queue_insights?.metrics?.total_partnership_value || 0), 0)
  };

  return (
    <DashboardPageLayout
      segments={[
        { label: 'Businesses', path: '/dashboard/businesses' },
        { label: 'Outreach Queue' }
      ]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business Outreach Queue</h1>
            <p className="text-muted-foreground">
              AI-prioritized partnership cultivation recommendations
            </p>
          </div>
          <Button onClick={generateQueue} disabled={generating}>
            <Target className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'Generate Queue'}
          </Button>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total in Queue</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold">{stats.highPriority}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Partnerships</p>
              <p className="text-2xl font-bold">{stats.critical}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${(stats.totalValue / 100).toFixed(0)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-4">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority Score</SelectItem>
            <SelectItem value="date">Outreach Date</SelectItem>
            <SelectItem value="value">Partnership Value</SelectItem>
            <SelectItem value="activity">Last Activity</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterHealth} onValueChange={setFilterHealth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="needs_attention">Needs Attention</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPotential} onValueChange={setFilterPotential}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by potential" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="high">High Potential</SelectItem>
            <SelectItem value="medium">Medium Potential</SelectItem>
            <SelectItem value="low">Low Potential</SelectItem>
          </SelectContent>
        </Select>
        </div>

        {/* Queue Items */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {queueItems.length === 0 ? 'No Queue Generated' : 'No Businesses Match Filters'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {queueItems.length === 0
                ? 'Generate the outreach queue to get AI-powered partnership recommendations'
                : 'Try adjusting your filters to see more businesses'}
            </p>
            {queueItems.length === 0 && (
              <Button onClick={generateQueue} disabled={generating}>
                <Target className="h-4 w-4 mr-2" />
                Generate Queue
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const healthInfo = getHealthStatusInfo(item.partnership_health_status);
              const potentialInfo = getExpansionPotentialInfo(item.expansion_potential_level);
              const metrics = item.queue_insights?.metrics || {};

              return (
                <Card
                  key={item.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/dashboard/businesses/${item.businesses.id}`)}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{item.businesses.business_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.businesses.industry && `${item.businesses.industry} • `}
                          {item.businesses.city && item.businesses.state && `${item.businesses.city}, ${item.businesses.state}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={healthInfo.color}>
                          {healthInfo.icon} {healthInfo.label}
                        </Badge>
                        <Badge className={getPriorityBadgeColor(item.priority_score)}>
                          Priority: {item.priority_score}
                        </Badge>
                      </div>
                    </div>

                    {/* AI Assessment */}
                    <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
                      <p className="text-sm">{item.queue_insights?.engagement_assessment}</p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Outreach Date</p>
                        <p className="font-medium">{new Date(item.recommended_outreach_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Partnership Value</p>
                        <p className="font-medium">${((metrics.total_partnership_value || 0) / 100).toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Linked Contacts</p>
                        <p className="font-medium">{metrics.linked_donor_count || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={potentialInfo.color}>
                        {potentialInfo.icon} {potentialInfo.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Outreach Target */}
                  <div>
                    <p className="text-sm font-medium mb-2">🎯 Recommended Target: {getContactTarget(item)}</p>
                  </div>

                  {/* Linked Contacts */}
                  {item.contacts && item.contacts.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Linked Contacts:</p>
                      <BusinessContactsList
                        businessId={item.businesses.id}
                        contacts={item.contacts}
                        recommendedTarget={item.recommended_outreach_target}
                        specificContactId={item.specific_contact_id}
                        compact={true}
                        showOutreachActions={false}
                      />
                    </div>
                  )}

                  {/* Next Actions */}
                  {item.queue_insights?.next_best_actions && (
                    <div>
                      <p className="text-sm font-medium mb-2">Next Actions:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        {item.queue_insights.next_best_actions.slice(0, 3).map((action: string, idx: number) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Metrics Footer */}
                  <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Engagement: {metrics.engagement_vitality_score || 0}/5</span>
                      <span>•</span>
                      <span>Last Activity: {metrics.days_since_last_activity || 0} days ago</span>
                      <span>•</span>
                      <span>Breadth: {metrics.engagement_breadth_score || 0}/5</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkContacted(item.id, item.businesses.id);
                      }}
                    >
                      Mark as Contacted
                    </Button>
                  </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardPageLayout>
  );
}