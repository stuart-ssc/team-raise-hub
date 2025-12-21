import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Calendar, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface DonorInsight {
  id: string;
  donor_id: string;
  priority_score: number;
  retention_risk_level: string;
  suggested_ask_amount: number;
  optimal_contact_date: string;
  insights: {
    engagement_strategy?: string;
    metrics: {
      lifetime_value: number;
      avg_donation: number;
      donation_count: number;
      days_since_last: number;
      engagement_score: number;
    };
  };
  donor_profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const OutreachQueue = () => {
  const navigate = useNavigate();
  const { organizationUser } = useOrganizationUser();
  const { activeGroup } = useActiveGroup();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'value'>('priority');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  const organizationId = organizationUser?.organization_id;

  const { data: insights, isLoading } = useQuery({
    queryKey: ['donor-insights', organizationId, activeGroup?.id],
    queryFn: async () => {
      if (!organizationId) return [];

      let query = supabase
        .from('donor_insights')
        .select(`
          *,
          donor_profiles(first_name, last_name, email)
        `)
        .eq('organization_id', organizationId);

      // Apply group filter if needed
      if (activeGroup?.id) {
        // Get donors for this group
        const { data: orders } = await supabase
          .from('orders')
          .select('customer_email, campaigns!inner(group_id)')
          .eq('campaigns.group_id', activeGroup.id)
          .in('status', ['succeeded', 'completed']);

        if (orders && orders.length > 0) {
          const emails = [...new Set(orders.map(o => o.customer_email).filter(Boolean))];
          const { data: donors } = await supabase
            .from('donor_profiles')
            .select('id')
            .in('email', emails);

          if (donors && donors.length > 0) {
            const donorIds = donors.map(d => d.id);
            query = query.in('donor_id', donorIds);
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        insights: item.insights as any
      })) as DonorInsight[];
    },
    enabled: !!organizationId,
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-batch-insights', {
        body: {
          organizationId,
          groupId: activeGroup?.id || 'all'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Insights generated for ${data.processed} donors`);
      queryClient.invalidateQueries({ queryKey: ['donor-insights'] });
    },
    onError: (error) => {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights');
    },
  });

  const sortedAndFilteredInsights = insights
    ?.filter(insight => filterRisk === 'all' || insight.retention_risk_level === filterRisk)
    ?.sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priority_score - a.priority_score;
      } else if (sortBy === 'date') {
        return new Date(a.optimal_contact_date).getTime() - new Date(b.optimal_contact_date).getTime();
      } else {
        return b.suggested_ask_amount - a.suggested_ask_amount;
      }
    });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'text-destructive';
    if (score >= 60) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <DashboardPageLayout
      segments={[
        { label: "Home", path: "/dashboard" },
        { label: "Donors", path: "/dashboard/donors" },
        { label: "Outreach Queue", path: "/dashboard/donors/outreach-queue" }
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Outreach Queue</h1>
            <p className="text-muted-foreground mt-1">
              AI-prioritized donor engagement recommendations
            </p>
          </div>
          <Button
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isPending}
          >
            {generateInsightsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total in Queue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights?.filter(i => i.priority_score >= 80).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights?.filter(i => i.retention_risk_level === 'high').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${((insights?.reduce((sum, i) => sum + i.suggested_ask_amount, 0) || 0) / 100).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority Score</SelectItem>
              <SelectItem value="date">Contact Date</SelectItem>
              <SelectItem value="value">Potential Value</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRisk} onValueChange={setFilterRisk}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Queue List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedAndFilteredInsights?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No insights generated yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Click "Generate Insights" to analyze your donors
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedAndFilteredInsights?.map((insight) => (
              <Card 
                key={insight.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/dashboard/donors/${insight.donor_id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {insight.donor_profiles.first_name} {insight.donor_profiles.last_name}
                        </h3>
                        <Badge variant={getRiskColor(insight.retention_risk_level)}>
                          {insight.retention_risk_level} risk
                        </Badge>
                        <span className={`text-sm font-semibold ${getPriorityColor(insight.priority_score)}`}>
                          Priority: {insight.priority_score}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {insight.donor_profiles.email}
                      </p>

                      {insight.insights.engagement_strategy && (
                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                          <p className="text-sm leading-relaxed">
                            {insight.insights.engagement_strategy}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Contact: {format(new Date(insight.optimal_contact_date), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Suggested: ${insight.suggested_ask_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>LTV: ${insight.insights.metrics.lifetime_value.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{insight.insights.metrics.donation_count} donations</span>
                        <span>•</span>
                        <span>Avg ${insight.insights.metrics.avg_donation.toFixed(2)}</span>
                        <span>•</span>
                        <span>{insight.insights.metrics.days_since_last} days since last donation</span>
                        <span>•</span>
                        <span>Engagement: {insight.insights.metrics.engagement_score}/100</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardPageLayout>
  );
};

export default OutreachQueue;