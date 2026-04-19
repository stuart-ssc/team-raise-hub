import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CampaignRecentOrdersCardProps {
  campaignId: string;
  onViewAll: () => void;
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function summarizeItems(items: unknown): string {
  if (!items) return "Donation";
  try {
    const parsed = typeof items === "string" ? JSON.parse(items) : items;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0];
      const name = first?.name || first?.item_name || "Item";
      const more = parsed.length > 1 ? ` +${parsed.length - 1}` : "";
      return `${name}${more}`;
    }
  } catch {
    /* noop */
  }
  return "Donation";
}

export function CampaignRecentOrdersCard({
  campaignId,
  onViewAll,
}: CampaignRecentOrdersCardProps) {
  const { data: orders } = useQuery({
    queryKey: ["campaign-recent-orders", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, items, items_total, files_complete, created_at")
        .eq("campaign_id", campaignId)
        .eq("status", "succeeded")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000,
  });

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Orders
        </CardTitle>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={onViewAll}
        >
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {!orders?.length ? (
          <p className="text-sm text-muted-foreground">No orders yet</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(order.customer_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {order.customer_name || "Anonymous"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {summarizeItems(order.items)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    ${(Number(order.items_total) || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        order.files_complete
                          ? "bg-green-500"
                          : "bg-amber-500"
                      )}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {order.files_complete ? "Complete" : "Pending"}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
