import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { FileCheck, FileWarning, ExternalLink } from "lucide-react";

interface CampaignOrdersSectionProps {
  campaignId: string;
}

type FilterType = "all" | "pending" | "complete";

export function CampaignOrdersSection({ campaignId }: CampaignOrdersSectionProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["campaign-orders", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, customer_email, customer_phone, items, total_amount, created_at, files_complete, status")
        .eq("campaign_id", campaignId)
        .eq("status", "succeeded")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredOrders = orders?.filter((order) => {
    if (filter === "pending") return order.files_complete === false;
    if (filter === "complete") return order.files_complete === true;
    return true;
  });

  const pendingCount = orders?.filter((o) => o.files_complete === false).length || 0;
  const completeCount = orders?.filter((o) => o.files_complete === true).length || 0;

  const parseItems = (items: any): string => {
    if (!items) return "-";
    try {
      const parsed = typeof items === "string" ? JSON.parse(items) : items;
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => item.name || item.item_name).filter(Boolean).join(", ") || "-";
      }
      return "-";
    } catch {
      return "-";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No orders yet</p>
        <p className="text-sm text-muted-foreground">Orders will appear here once supporters make purchases</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList>
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending Files ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="complete">Complete ({completeCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead>Files</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customer_name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                  {parseItems(order.items)}
                </TableCell>
                <TableCell>${(order.total_amount || 0).toLocaleString()}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {order.created_at ? format(new Date(order.created_at), "MMM d, yyyy") : "-"}
                </TableCell>
                <TableCell>
                  {order.files_complete ? (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
                      <FileCheck className="h-3 w-3" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
                      <FileWarning className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
