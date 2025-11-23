import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

interface PendingOrganization {
  id: string;
  name: string;
  organization_type: 'school' | 'nonprofit';
  email: string;
  verification_submitted_at: string;
}

const VerificationQueue = () => {
  const [organizations, setOrganizations] = useState<PendingOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<PendingOrganization | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingOrganizations();
  }, []);

  const fetchPendingOrganizations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('verification_status', 'in_review')
      .order('verification_submitted_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending organizations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending verifications",
        variant: "destructive"
      });
    } else {
      setOrganizations(data || []);
    }
    setLoading(false);
  };

  const handleVerificationAction = async (status: 'approved' | 'rejected') => {
    if (!selectedOrg) return;

    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          organizationId: selectedOrg.id,
          status,
          notes
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Organization ${status === 'approved' ? 'approved' : 'rejected'} successfully`
      });

      setSelectedOrg(null);
      setNotes("");
      fetchPendingOrganizations();
    } catch (error) {
      console.error('Error processing verification:', error);
      toast({
        title: "Error",
        description: "Failed to process verification",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Verification Queue</h1>
              <p className="text-muted-foreground">Review and approve organization verifications</p>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : organizations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No pending verifications
                        </TableCell>
                      </TableRow>
                    ) : (
                      organizations.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell>
                            <Badge>{org.organization_type}</Badge>
                          </TableCell>
                          <TableCell>{org.email}</TableCell>
                          <TableCell>
                            {new Date(org.verification_submitted_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedOrg(org)}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Verification: {selectedOrg?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this verification..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleVerificationAction('approved')}
                disabled={actionLoading}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => handleVerificationAction('rejected')}
                disabled={actionLoading}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationQueue;
