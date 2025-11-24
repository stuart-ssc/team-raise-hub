import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface BusinessInsightsPanelProps {
  businessId: string;
  organizationId: string;
}

interface BusinessInsights {
  insights: any;
  partnership_health_score: number;
  risk_level: string;
  expansion_potential: string;
  optimal_outreach_date: string | null;
  priority_score: number;
  generated_at: string;
}

export const BusinessInsightsPanel = ({ businessId, organizationId }: BusinessInsightsPanelProps) => {
  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInsights();
  }, [businessId]);

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('business_insights')
        .select('*')
        .eq('business_id', businessId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setInsights(data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-business-insights', {
        body: { businessId, organizationId }
      });

      if (error) throw error;

      toast({
        title: "Insights Generated",
        description: "AI-powered partnership insights have been generated successfully.",
      });

      await fetchInsights();
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getExpansionColor = (level: string) => {
    switch (level) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Partnership Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Partnership Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate AI-powered insights to understand partnership health, identify opportunities, and get actionable recommendations.
          </p>
          <Button 
            onClick={generateInsights} 
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Insights...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const insightData = insights.insights || {};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Partnership Insights
          </CardTitle>
          <Button 
            onClick={generateInsights} 
            disabled={generating}
            variant="outline"
            size="sm"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Partnership Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Partnership Health</span>
            <Badge variant={insights.partnership_health_score >= 70 ? 'default' : insights.partnership_health_score >= 40 ? 'secondary' : 'destructive'}>
              {insights.partnership_health_score}/100
            </Badge>
          </div>
          <Progress value={insights.partnership_health_score} className="h-2" />
          {insightData.PARTNERSHIP_HEALTH && (
            <p className="text-sm text-muted-foreground mt-2">
              {insightData.PARTNERSHIP_HEALTH}
            </p>
          )}
        </div>

        {/* Risk & Expansion Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={getRiskColor(insights.risk_level)}>
            Risk: {insights.risk_level}
          </Badge>
          <Badge variant={getExpansionColor(insights.expansion_potential)}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {insights.expansion_potential} expansion potential
          </Badge>
        </div>

        {/* Outreach Timing */}
        {insights.optimal_outreach_date && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
            <Calendar className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-medium">Optimal Outreach Date</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(insights.optimal_outreach_date), 'MMMM d, yyyy')}
              </p>
              {insightData.OUTREACH_TIMING && (
                <p className="text-xs text-muted-foreground mt-1">
                  {insightData.OUTREACH_TIMING.split('.').slice(1).join('.').trim()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Expansion Opportunities */}
        {insightData.EXPANSION_OPPORTUNITIES && insightData.EXPANSION_OPPORTUNITIES.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Expansion Opportunities</span>
            </div>
            <ul className="space-y-2">
              {insightData.EXPANSION_OPPORTUNITIES.map((opp, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Indicators */}
        {insightData.RISK_INDICATORS && insightData.RISK_INDICATORS.length > 0 && 
         insightData.RISK_INDICATORS[0] !== "None" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Risk Indicators</span>
            </div>
            <ul className="space-y-2">
              {insightData.RISK_INDICATORS.map((risk, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Best Actions */}
        {insightData.NEXT_BEST_ACTIONS && insightData.NEXT_BEST_ACTIONS.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Next Best Actions</span>
            </div>
            <ul className="space-y-2">
              {insightData.NEXT_BEST_ACTIONS.map((action, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">{idx + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Messaging Strategy */}
        {insightData.MESSAGING_STRATEGY && insightData.MESSAGING_STRATEGY.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Messaging Strategy</span>
            </div>
            <ul className="space-y-2">
              {insightData.MESSAGING_STRATEGY.map((msg, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Generated timestamp */}
        <p className="text-xs text-muted-foreground text-center pt-4 border-t">
          Generated {format(new Date(insights.generated_at), 'MMM d, yyyy h:mm a')}
        </p>
      </CardContent>
    </Card>
  );
};
