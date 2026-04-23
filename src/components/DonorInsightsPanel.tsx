import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Calendar,
  DollarSign,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DonorInsights {
  bestTimeToReachOut: {
    dayOfWeek: string;
    timeOfDay: string;
    reason: string;
  };
  optimalAskAmount: {
    amount: number;
    range: {
      min: number;
      max: number;
    };
    reasoning: string;
  };
  messagingStrategy: {
    tone: string;
    focusAreas: string[];
    sampleSubjectLines: string[];
    keyMessages: string[];
  };
  retentionRisk: {
    level: 'low' | 'medium' | 'high';
    indicators: string[];
    interventions: string[];
  };
  nextBestActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    timeline: string;
    expectedImpact: string;
  }>;
}

interface DonorInsightsPanelProps {
  donorId: string;
}

const DonorInsightsPanel = ({ donorId }: DonorInsightsPanelProps) => {
  const { toast } = useToast();
  const [insights, setInsights] = useState<DonorInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-donor-insights', {
        body: { donorId }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast({
            title: "Rate Limit Reached",
            description: "Please wait a moment before generating more insights.",
            variant: "destructive",
          });
        } else if (data.error.includes('credits')) {
          toast({
            title: "Credits Exhausted",
            description: "Please add more AI credits to continue.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setInsights(data.insights);
      setGeneratedAt(data.generatedAt);
      toast({
        title: "Insights Generated",
        description: "AI has analyzed this donor's giving patterns and generated personalized recommendations.",
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate donor insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="px-6 pb-6 space-y-6">
      <Button
            onClick={generateInsights} 
            disabled={loading}
            variant={insights ? "outline" : "default"}
            size="sm"
            className="w-fit"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : insights ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
      </Button>
      {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : !insights ? (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Click "Generate Insights" to analyze this donor's profile and receive AI-powered recommendations
              for optimal engagement timing, ask amounts, and messaging strategies.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {generatedAt && (
              <p className="text-xs text-muted-foreground">
                Generated {new Date(generatedAt).toLocaleString()}
              </p>
            )}

            {/* Best Time to Reach Out */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Best Time to Reach Out
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {insights.bestTimeToReachOut.dayOfWeek}
                  </Badge>
                  <Badge variant="secondary" className="font-mono">
                    {insights.bestTimeToReachOut.timeOfDay}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {insights.bestTimeToReachOut.reason}
                </p>
              </CardContent>
            </Card>

            {/* Optimal Ask Amount */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  Optimal Ask Amount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-success">
                    {formatCurrency(insights.optimalAskAmount.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Range: {formatCurrency(insights.optimalAskAmount.range.min)} - {formatCurrency(insights.optimalAskAmount.range.max)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {insights.optimalAskAmount.reasoning}
                </p>
              </CardContent>
            </Card>

            {/* Messaging Strategy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Messaging Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Recommended Tone</p>
                  <Badge variant="outline">{insights.messagingStrategy.tone}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Focus Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {insights.messagingStrategy.focusAreas.map((area, idx) => (
                      <Badge key={idx} variant="secondary">{area}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Sample Subject Lines</p>
                  <ul className="space-y-1">
                    {insights.messagingStrategy.sampleSubjectLines.map((line, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Key Messages</p>
                  <ul className="space-y-1">
                    {insights.messagingStrategy.keyMessages.map((message, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Retention Risk */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Retention Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge variant={getRiskColor(insights.retentionRisk.level)}>
                    {insights.retentionRisk.level.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Risk Indicators</p>
                  <ul className="space-y-1">
                    {insights.retentionRisk.indicators.map((indicator, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                        <span>{indicator}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Recommended Interventions</p>
                  <ul className="space-y-1">
                    {insights.retentionRisk.interventions.map((intervention, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{intervention}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Next Best Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Next Best Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.nextBestActions.map((action, idx) => (
                    <Card key={idx} className={getPriorityColor(action.priority)}>
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{action.action}</p>
                          <Badge variant="outline" className="text-xs">
                            {action.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {action.timeline}
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {action.expectedImpact}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
    </div>
  );
};

export default DonorInsightsPanel;
