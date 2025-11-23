import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  ExternalLink, 
  AlertCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileCheck
} from "lucide-react";

interface PendingOrganization {
  id: string;
  name: string;
  organization_type: 'school' | 'nonprofit';
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  verification_submitted_at: string;
  verification_documents: any;
  nonprofits?: {
    ein: string | null;
    mission_statement: string | null;
  };
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
      .select(`
        *,
        nonprofits(ein, mission_statement)
      `)
      .eq('verification_status', 'pending')
      .not('verification_submitted_at', 'is', null)
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

    if (status === 'rejected' && !notes.trim()) {
      toast({
        title: "Notes required",
        description: "Please provide notes explaining why the verification was rejected",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          organizationId: selectedOrg.id,
          status,
          notes: notes.trim() || undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Organization ${status === 'approved' ? 'approved' : 'rejected'} successfully. Email notification sent.`
      });

      setSelectedOrg(null);
      setNotes("");
      fetchPendingOrganizations();
    } catch (error: any) {
      console.error('Error processing verification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process verification",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getDocumentUrl = (documents: any): string | null => {
    if (!documents) return null;
    if (Array.isArray(documents) && documents.length > 0) {
      return documents[0].url;
    }
    return null;
  };

  const getDaysSinceSubmission = (date: string): number => {
    const submitted = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submitted.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

            {organizations.length > 0 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>{organizations.length}</strong> organization{organizations.length !== 1 ? 's' : ''} pending verification
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 animate-spin" />
                            Loading verifications...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : organizations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileCheck className="h-12 w-12 opacity-50" />
                            <p className="font-medium">No pending verifications</p>
                            <p className="text-sm">All organizations are verified</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      organizations.map((org) => {
                        const daysSince = getDaysSinceSubmission(org.verification_submitted_at);
                        const hasDocuments = !!getDocumentUrl(org.verification_documents);
                        
                        return (
                          <TableRow key={org.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{org.name}</div>
                                {org.city && org.state && (
                                  <div className="text-sm text-muted-foreground">
                                    {org.city}, {org.state}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={org.organization_type === 'nonprofit' ? 'default' : 'secondary'}>
                                {org.organization_type === 'nonprofit' ? 'Non-Profit' : 'School'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {org.email}
                                </div>
                                {org.phone && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {org.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{new Date(org.verification_submitted_at).toLocaleDateString()}</div>
                                <div className="text-muted-foreground">
                                  {daysSince} day{daysSince !== 1 ? 's' : ''} ago
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {hasDocuments ? (
                                <Badge variant="outline" className="gap-1">
                                  <FileText className="h-3 w-3" />
                                  Available
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  None
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => setSelectedOrg(org)}
                              >
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={!!selectedOrg} onOpenChange={() => { setSelectedOrg(null); setNotes(""); }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Review: {selectedOrg?.name}
            </DialogTitle>
            <DialogDescription>
              Review organization details and verification documents
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="space-y-6 pr-4">
              {/* Organization Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Organization Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Type</div>
                      <Badge className="mt-1">
                        {selectedOrg?.organization_type === 'nonprofit' ? 'Non-Profit' : 'School'}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Submitted</div>
                      <div className="mt-1">
                        {selectedOrg?.verification_submitted_at 
                          ? new Date(selectedOrg.verification_submitted_at).toLocaleDateString()
                          : '—'}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Email</div>
                        <div>{selectedOrg?.email}</div>
                      </div>
                    </div>
                    
                    {selectedOrg?.phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Phone</div>
                          <div>{selectedOrg.phone}</div>
                        </div>
                      </div>
                    )}

                    {(selectedOrg?.city || selectedOrg?.state) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Location</div>
                          <div>
                            {selectedOrg.city && selectedOrg.city}
                            {selectedOrg.city && selectedOrg.state && ', '}
                            {selectedOrg.state && selectedOrg.state}
                            {selectedOrg.zip && ` ${selectedOrg.zip}`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Non-Profit Specific Details */}
              {selectedOrg?.organization_type === 'nonprofit' && selectedOrg.nonprofits && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Non-Profit Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {selectedOrg.nonprofits.ein && (
                      <div>
                        <div className="text-muted-foreground">EIN</div>
                        <div className="font-mono mt-1">{selectedOrg.nonprofits.ein}</div>
                      </div>
                    )}
                    
                    {selectedOrg.nonprofits.mission_statement && (
                      <div>
                        <div className="text-muted-foreground">Mission Statement</div>
                        <div className="mt-1 text-foreground/90">
                          {selectedOrg.nonprofits.mission_statement}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Verification Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Verification Documents</CardTitle>
                  <CardDescription>
                    Review uploaded documents to verify organization status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getDocumentUrl(selectedOrg?.verification_documents) ? (
                    <div className="space-y-3">
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                          501(c)(3) determination letter or equivalent verification document
                        </AlertDescription>
                      </Alert>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const url = getDocumentUrl(selectedOrg?.verification_documents);
                          if (url) window.open(url, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Verification Document
                      </Button>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No verification documents have been uploaded
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reviewer Notes</CardTitle>
                  <CardDescription>
                    Add notes about the verification (required for rejection)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes about this verification review..."
                    rows={4}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setSelectedOrg(null); setNotes(""); }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleVerificationAction('rejected')}
              disabled={actionLoading}
              variant="destructive"
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              {actionLoading ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button
              onClick={() => handleVerificationAction('approved')}
              disabled={actionLoading}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {actionLoading ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationQueue;
