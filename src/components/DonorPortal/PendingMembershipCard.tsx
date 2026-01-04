import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock, X, Building2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PendingRequest {
  id: string;
  status: string;
  created_at: string;
  organization: {
    name: string;
  } | null;
  user_type: {
    name: string;
  } | null;
  group: {
    group_name: string;
  } | null;
}

export function PendingMembershipCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("membership_requests")
        .select(`
          id,
          status,
          created_at,
          organization_id,
          user_type_id,
          group_id
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related data
      const requestsWithDetails = await Promise.all(
        (data || []).map(async (request) => {
          // Get organization
          const { data: org } = await supabase
            .from("organizations")
            .select("name")
            .eq("id", request.organization_id)
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

          return {
            id: request.id,
            status: request.status,
            created_at: request.created_at,
            organization: org,
            user_type: userType,
            group,
          };
        })
      );

      setRequests(requestsWithDetails);
    } catch (error) {
      console.error("Error fetching membership requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleCancel = async (requestId: string) => {
    setCanceling(requestId);
    try {
      const { error } = await supabase
        .from("membership_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Request Cancelled",
        description: "Your membership request has been cancelled.",
      });

      fetchRequests();
    } catch (error: any) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request",
        variant: "destructive",
      });
    } finally {
      setCanceling(null);
    }
  };

  if (loading || requests.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-primary" />
          Pending Membership Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background border"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{request.organization?.name || 'Unknown Organization'}</p>
                <p className="text-sm text-muted-foreground">
                  {request.user_type?.name}
                  {request.group && ` • ${request.group.group_name}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Pending</Badge>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={canceling === request.id}
                  >
                    {canceling === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Request?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your membership request to{" "}
                      {request.organization?.name}? You can submit a new request later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Request</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancel(request.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Request
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground text-center pt-2">
          You'll be notified when your request is reviewed
        </p>
      </CardContent>
    </Card>
  );
}
