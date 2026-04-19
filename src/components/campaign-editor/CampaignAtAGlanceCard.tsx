import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { differenceInCalendarDays } from "date-fns";

interface CampaignAtAGlanceCardProps {
  campaignId: string;
  goalAmount: number;
  endDate?: string | null;
}

export function CampaignAtAGlanceCard({
  campaignId,
  goalAmount,
  endDate,
}: CampaignAtAGlanceCardProps) {
  const { data: stats } = useQuery({
    queryKey: ["campaign-stats", campaignId],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("items_total, files_complete")
        .eq("campaign_id", campaignId)
        .eq("status", "succeeded");

      if (error) throw error;

      const totalRaised =
        orders?.reduce((sum, o) => sum + (Number(o.items_total) || 0), 0) || 0;
      const orderCount = orders?.length || 0;
      const pendingFiles =
        orders?.filter((o) => o.files_complete === false).length || 0;

      return { totalRaised, orderCount, pendingFiles };
    },
    staleTime: 30 * 1000,
  });

  const totalRaised = stats?.totalRaised || 0;
  const orderCount = stats?.orderCount || 0;
  const pendingFiles = stats?.pendingFiles || 0;
  const progressPercent =
    goalAmount > 0 ? Math.min((totalRaised / goalAmount) * 100, 100) : 0;

  const daysLeft = endDate
    ? Math.max(0, differenceInCalendarDays(new Date(endDate), new Date()))
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          At a Glance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold">
            ${totalRaised.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            raised
            {goalAmount > 0 && <> of ${goalAmount.toLocaleString()}</>}
          </p>
          {goalAmount > 0 && (
            <Progress value={progressPercent} className="mt-2 h-2" />
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t pt-4">
          <div>
            <p className="text-xl font-bold">{orderCount}</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </div>
          <div>
            <p className="text-xl font-bold">{pendingFiles}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="text-xl font-bold">
              {daysLeft === null ? "—" : daysLeft}
            </p>
            <p className="text-xs text-muted-foreground">Days left</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
