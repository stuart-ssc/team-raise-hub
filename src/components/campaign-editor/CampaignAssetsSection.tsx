import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { FileWarning, FileCheck } from "lucide-react";

interface CampaignAssetsSectionProps {
  campaignId: string;
}

export function CampaignAssetsSection({ campaignId }: CampaignAssetsSectionProps) {
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["campaign-pending-asset-orders", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, customer_name, customer_email, items_total, created_at, files_complete"
        )
        .eq("campaign_id", campaignId)
        .eq("status", "succeeded")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pending = orders?.filter((o) => o.files_complete === false) || [];
  const complete = orders?.filter((o) => o.files_complete === true) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading assets...</p>
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No orders yet</p>
        <p className="text-sm text-muted-foreground">
          Asset uploads will appear here once supporters make purchases.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileWarning className="h-4 w-4 text-amber-600" />
            <span className="text-sm">Pending uploads</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{pending.length}</p>
        </div>
        <div className="rounded-md border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileCheck className="h-4 w-4 text-green-600" />
            <span className="text-sm">Complete</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{complete.length}</p>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">Awaiting assets</h4>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All orders have submitted their required assets. 🎉
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Ordered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {order.customer_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      ${(Number(order.items_total) || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {order.created_at
                        ? format(new Date(order.created_at), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="gap-1 text-amber-600 border-amber-200 bg-amber-50"
                      >
                        <FileWarning className="h-3 w-3" />
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/dashboard/campaigns/${campaignId}/orders/${order.id}`
                          )
                        }
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
