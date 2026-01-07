import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, ShoppingCart, FileWarning, Target } from "lucide-react";

interface CampaignStatsCardProps {
  campaignId: string;
  goalAmount: number;
}

export function CampaignStatsCard({ campaignId, goalAmount }: CampaignStatsCardProps) {
  const { data: stats } = useQuery({
    queryKey: ["campaign-stats", campaignId],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("items_total, files_complete")
        .eq("campaign_id", campaignId)
        .eq("status", "succeeded");

      if (error) throw error;

      const totalRaised = orders?.reduce((sum, o) => sum + (Number(o.items_total) || 0), 0) || 0;
      const orderCount = orders?.length || 0;
      const pendingFiles = orders?.filter(o => o.files_complete === false).length || 0;

      return {
        totalRaised,
        orderCount,
        pendingFiles,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const totalRaised = stats?.totalRaised || 0;
  const orderCount = stats?.orderCount || 0;
  const pendingFiles = stats?.pendingFiles || 0;
  const progressPercent = goalAmount > 0 ? Math.min((totalRaised / goalAmount) * 100, 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Raised</p>
              <p className="text-2xl font-bold">${totalRaised.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Goal Progress</p>
              <p className="text-2xl font-bold">{progressPercent.toFixed(0)}%</p>
              <Progress value={progressPercent} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Orders</p>
              <p className="text-2xl font-bold">{orderCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-3 ${pendingFiles > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <FileWarning className={`h-5 w-5 ${pendingFiles > 0 ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Uploads</p>
              <p className="text-2xl font-bold">{pendingFiles}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
