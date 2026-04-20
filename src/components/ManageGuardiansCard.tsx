import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, Mail, Clock, X, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import InviteParentDialog from "./InviteParentDialog";
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

interface LinkedGuardian {
  id: string;
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  user_type: {
    name: string;
  } | null;
}

interface PendingInvitation {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  relationship: string | null;
  status: string;
  created_at: string;
  expires_at: string;
}

interface ManageGuardiansCardProps {
  organizationUserId: string;
  organizationId: string;
  groupId: string | null;
  rosterId: number | null;
}

const ManageGuardiansCard = ({
  organizationUserId,
  organizationId,
  groupId,
  rosterId,
}: ManageGuardiansCardProps) => {
  const { toast } = useToast();
  const [linkedGuardians, setLinkedGuardians] = useState<LinkedGuardian[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch linked guardians (family members linked to this player)
      const { data: guardians, error: guardiansError } = await supabase
        .from("organization_user")
        .select(`
          id,
          profile:profiles(id, first_name, last_name),
          user_type:user_type(name)
        `)
        .eq("linked_organization_user_id", organizationUserId)
        .eq("active_user", true);

      if (guardiansError) throw guardiansError;
      setLinkedGuardians(guardians || []);

      // Fetch pending invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from("parent_invitations")
        .select("*")
        .eq("inviter_organization_user_id", organizationUserId)
        .in("status", ["pending"])
        .order("created_at", { ascending: false });

      if (invitationsError) throw invitationsError;
      setPendingInvitations(invitations || []);
    } catch (error) {
      console.error("Error fetching guardians:", error);
      toast({
        title: "Error",
        description: "Failed to load family members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [organizationUserId]);

  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingId(invitationId);
    try {
      const { error } = await supabase
        .from("parent_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled",
      });
      fetchData();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  const handleResendInvitation = async (invitation: PendingInvitation) => {
    setResendingId(invitation.id);
    try {
      // Cancel old invitation
      await supabase
        .from("parent_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitation.id);

      // Send new invitation
      const { error } = await supabase.functions.invoke("send-parent-invitation", {
        body: {
          email: invitation.email,
          firstName: invitation.first_name,
          lastName: invitation.last_name,
          relationship: invitation.relationship,
          organizationUserId,
          organizationId,
          groupId,
          rosterId,
        },
      });

      if (error) throw error;

      toast({
        title: "Invitation Resent",
        description: `A new invitation has been sent to ${invitation.email}`,
      });
      fetchData();
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() || "?";
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <>
      <Card className="bg-gradient-to-br from-emerald-50 via-green-50 to-white border-emerald-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                My Family Members
              </CardTitle>
              <CardDescription>
                Invite parents or guardians to follow your fundraising progress
              </CardDescription>
            </div>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Parent
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : linkedGuardians.length === 0 && pendingInvitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No family members linked yet</p>
              <p className="text-sm">Invite a parent or guardian to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Linked Guardians */}
              {linkedGuardians.map((guardian) => (
                <div
                  key={guardian.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(
                          guardian.profile?.first_name || null,
                          guardian.profile?.last_name || null
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {guardian.profile?.first_name} {guardian.profile?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {guardian.user_type?.name || "Family Member"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Connected</Badge>
                </div>
              ))}

              {/* Pending Invitations */}
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-muted">
                        <Mail className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {invitation.first_name && invitation.last_name
                          ? `${invitation.first_name} ${invitation.last_name}`
                          : invitation.email}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {isExpired(invitation.expires_at) ? (
                          <span className="text-destructive">Expired</span>
                        ) : (
                          <span>
                            Expires{" "}
                            {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Pending</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleResendInvitation(invitation)}
                      disabled={resendingId === invitation.id}
                    >
                      {resendingId === invitation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmCancelId(invitation.id)}
                      disabled={cancellingId === invitation.id}
                    >
                      {cancellingId === invitation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteParentDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        organizationUserId={organizationUserId}
        organizationId={organizationId}
        groupId={groupId}
        rosterId={rosterId}
        onInviteSent={fetchData}
      />

      <AlertDialog open={!!confirmCancelId} onOpenChange={() => setConfirmCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the pending invitation. You can always send a new one later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmCancelId && handleCancelInvitation(confirmCancelId)}
            >
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageGuardiansCard;
