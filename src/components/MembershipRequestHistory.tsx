import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, History, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

interface HistoryRequest {
  id: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  user: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  user_type: {
    name: string;
  } | null;
  group: {
    group_name: string;
  } | null;
  reviewer: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface MembershipRequestHistoryProps {
  organizationId: string;
}

export function MembershipRequestHistory({ organizationId }: MembershipRequestHistoryProps) {
  const [requests, setRequests] = useState<HistoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("membership_requests")
        .select(`
          id,
          status,
          created_at,
          reviewed_at,
          reviewer_notes,
          user_id,
          user_type_id,
          group_id,
          reviewed_by
        `)
        .eq("organization_id", organizationId)
        .in("status", ["approved", "rejected"])
        .order("reviewed_at", { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) throw error;

      // Fetch related data
      const requestsWithDetails = await Promise.all(
        (data || []).map(async (request) => {
          // Get user profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", request.user_id)
            .single();

          // Get user type
          const { data: userType } = await supabase
            .from("user_type")
            .select("name")
            .eq("id", request.user_type_id)
            .single();

          // Get group if applicable
          let group = null;
          if (request.group_id) {
            const { data: groupData } = await supabase
              .from("groups")
              .select("group_name")
              .eq("id", request.group_id)
              .single();
            group = groupData;
          }

          // Get reviewer profile if applicable
          let reviewer = null;
          if (request.reviewed_by) {
            const { data: reviewerData } = await supabase
              .from("profiles")
              .select("first_name, last_name")
              .eq("id", request.reviewed_by)
              .single();
            reviewer = reviewerData;
          }

          return {
            id: request.id,
            status: request.status,
            created_at: request.created_at,
            reviewed_at: request.reviewed_at,
            reviewer_notes: request.reviewer_notes,
            user: profile,
            user_type: userType,
            group,
            reviewer,
          };
        })
      );

      setRequests(requestsWithDetails);
    } catch (error) {
      console.error("Error fetching request history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchHistory();
    }
  }, [organizationId]);

  // Real-time subscription for history updates
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('membership-request-history')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'membership_requests',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">No Request History</h3>
          <p className="text-muted-foreground">
            Processed membership requests will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getReviewerName = (reviewer: HistoryRequest["reviewer"]) => {
    if (!reviewer) return "System";
    if (reviewer.first_name || reviewer.last_name) {
      return `${reviewer.first_name || ""} ${reviewer.last_name || ""}`.trim();
    }
    return "Unknown";
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {request.status === "approved" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">
                      {request.user?.first_name || "Unknown"} {request.user?.last_name || ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.user_type?.name}
                      {request.group && ` • ${request.group.group_name}`}
                    </p>
                  </div>
                </div>
                <Badge variant={request.status === "approved" ? "default" : "destructive"}>
                  {request.status === "approved" ? "Approved" : "Rejected"}
                </Badge>
              </div>
              
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Requested:</span>
                  <span>{format(new Date(request.created_at), "MMM d, yyyy")}</span>
                </div>
                {request.reviewed_at && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Reviewed:</span>
                    <span>{format(new Date(request.reviewed_at), "MMM d, yyyy")}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Reviewed by:</span>
                  <span>{getReviewerName(request.reviewer)}</span>
                </div>
              </div>
              
              {request.reviewer_notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Notes:</p>
                  <p className="text-sm">{request.reviewer_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Requested Role</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reviewed</TableHead>
              <TableHead>Reviewed By</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.user?.first_name || "Unknown"} {request.user?.last_name || ""}
                </TableCell>
                <TableCell>{request.user_type?.name || "-"}</TableCell>
                <TableCell>{request.group?.group_name || "-"}</TableCell>
                <TableCell>
                  <Badge variant={request.status === "approved" ? "default" : "destructive"}>
                    {request.status === "approved" ? "Approved" : "Rejected"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {request.reviewed_at 
                    ? format(new Date(request.reviewed_at), "MMM d, yyyy h:mm a")
                    : "-"
                  }
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getReviewerName(request.reviewer)}
                </TableCell>
                <TableCell className="max-w-xs">
                  {request.reviewer_notes ? (
                    <p className="text-sm text-muted-foreground truncate" title={request.reviewer_notes}>
                      {request.reviewer_notes}
                    </p>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}