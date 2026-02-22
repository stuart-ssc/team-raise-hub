import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, X, Loader2, Clock, User, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MembershipRequest {
  id: string;
  user_id: string;
  organization_id: string;
  group_id: string | null;
  user_type_id: string;
  status: string;
  requester_message: string | null;
  created_at: string;
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
}

interface MembershipRequestsTabProps {
  organizationId: string;
  onRequestProcessed?: () => void;
}

export function MembershipRequestsTab({ organizationId, onRequestProcessed }: MembershipRequestsTabProps) {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MembershipRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("membership_requests")
        .select(`
          id,
          user_id,
          organization_id,
          group_id,
          user_type_id,
          status,
          requester_message,
          created_at
        `)
        .eq("organization_id", organizationId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

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

          return {
            ...request,
            user: profile,
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
    if (organizationId) {
      fetchRequests();
    }
  }, [organizationId]);

  // Real-time subscription for requests list
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel('membership-requests-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membership_requests',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          fetchRequests();
          onRequestProcessed?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  const sendDecisionNotification = async (
    request: MembershipRequest,
    decision: "approved" | "rejected",
    notes?: string
  ) => {
    try {
      // Get organization name
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", request.organization_id)
        .single();

      await supabase.functions.invoke("send-membership-decision-notification", {
        body: {
          userId: request.user_id,
          organizationName: org?.name || "the organization",
          decision,
          roleName: request.user_type?.name || "Member",
          groupName: request.group?.group_name,
          reviewerNotes: notes,
        },
      });
    } catch (error) {
      console.error("Failed to send decision notification email:", error);
      // Don't throw - email is secondary to the approval/rejection
    }
  };

  const handleApprove = async (request: MembershipRequest) => {
    setProcessing(request.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("membership_requests")
        .update({ 
          status: "approved",
          reviewer_notes: reviewerNotes || null,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      // Send email notification
      await sendDecisionNotification(request, "approved");

      toast({
        title: "Request Approved",
        description: `${request.user?.first_name || 'User'} has been added to the organization.`,
      });

      setApproveDialogOpen(false);
      setSelectedRequest(null);
      setReviewerNotes("");
      fetchRequests();
      onRequestProcessed?.();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: MembershipRequest) => {
    if (!reviewerNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide a reason for rejecting this request.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(request.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("membership_requests")
        .update({ 
          status: "rejected",
          reviewer_notes: reviewerNotes,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      // Send email notification with reviewer notes
      await sendDecisionNotification(request, "rejected", reviewerNotes);

      toast({
        title: "Request Rejected",
        description: "The membership request has been rejected.",
      });

      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setReviewerNotes("");
      fetchRequests();
      onRequestProcessed?.();
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading requests...</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">No Pending Requests</h3>
          <p className="text-muted-foreground">
            There are no pending membership requests to join your team at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {request.user?.first_name || 'Unknown'} {request.user?.last_name || ''}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested Role:</span>
                  <span className="font-medium">{request.user_type?.name || '-'}</span>
                </div>
                {request.group && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group:</span>
                    <span className="font-medium">{request.group.group_name}</span>
                  </div>
                )}
                {request.requester_message && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-muted-foreground text-xs mb-1">Message:</p>
                    <p className="text-sm italic">"{request.requester_message}"</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={processing === request.id}
                  onClick={() => {
                    setSelectedRequest(request);
                    setApproveDialogOpen(true);
                  }}
                >
                  {processing === request.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={processing === request.id}
                  onClick={() => {
                    setSelectedRequest(request);
                    setRejectDialogOpen(true);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Approve Dialog */}
        <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Membership Request</AlertDialogTitle>
              <AlertDialogDescription>
                Approve {selectedRequest?.user?.first_name}'s request to join as {selectedRequest?.user_type?.name}?
                They will immediately gain access to the organization and receive an email notification.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {selectedRequest?.requester_message && (
              <div className="bg-muted p-3 rounded-md my-2">
                <p className="text-xs text-muted-foreground mb-1">Message from requester:</p>
                <p className="text-sm italic">"{selectedRequest.requester_message}"</p>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setReviewerNotes("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedRequest && handleApprove(selectedRequest)}
                disabled={processing !== null}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Dialog */}
        <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Membership Request</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for rejecting this request. The user will be notified via email.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {selectedRequest?.requester_message && (
              <div className="bg-muted p-3 rounded-md my-2">
                <p className="text-xs text-muted-foreground mb-1">Message from requester:</p>
                <p className="text-sm italic">"{selectedRequest.requester_message}"</p>
              </div>
            )}
            <Textarea
              placeholder="Reason for rejection..."
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              className="mt-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setReviewerNotes("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedRequest && handleReject(selectedRequest)}
                disabled={processing !== null || !reviewerNotes.trim()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
              <TableHead>Requested</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{request.user?.first_name || 'Unknown'} {request.user?.last_name || ''}</span>
                    {request.requester_message && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <MessageSquare className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs text-muted-foreground mb-1">Message from requester:</p>
                            <p className="text-sm">"{request.requester_message}"</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>{request.user_type?.name || '-'}</TableCell>
                <TableCell>{request.group?.group_name || '-'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      disabled={processing === request.id}
                      onClick={() => {
                        setSelectedRequest(request);
                        setApproveDialogOpen(true);
                      }}
                    >
                      {processing === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processing === request.id}
                      onClick={() => {
                        setSelectedRequest(request);
                        setRejectDialogOpen(true);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Membership Request</AlertDialogTitle>
            <AlertDialogDescription>
              Approve {selectedRequest?.user?.first_name}'s request to join as {selectedRequest?.user_type?.name}?
              They will immediately gain access to the organization and receive an email notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedRequest?.requester_message && (
            <div className="bg-muted p-3 rounded-md my-2">
              <p className="text-xs text-muted-foreground mb-1">Message from requester:</p>
              <p className="text-sm italic">"{selectedRequest.requester_message}"</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReviewerNotes("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleApprove(selectedRequest)}
              disabled={processing !== null}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Membership Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this request. The user will be notified via email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedRequest?.requester_message && (
            <div className="bg-muted p-3 rounded-md my-2">
              <p className="text-xs text-muted-foreground mb-1">Message from requester:</p>
              <p className="text-sm italic">"{selectedRequest.requester_message}"</p>
            </div>
          )}
          <Textarea
            placeholder="Reason for rejection..."
            value={reviewerNotes}
            onChange={(e) => setReviewerNotes(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReviewerNotes("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleReject(selectedRequest)}
              disabled={processing !== null || !reviewerNotes.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
