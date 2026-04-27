import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Eye, Globe } from "lucide-react";

interface CampaignPublicationControlProps {
  campaignId: string;
  campaignName: string;
  groupId: string;
  currentStatus: string;
  enableRosterAttribution?: boolean;
  onStatusChange: () => void;
  triggerOpen?: boolean;
  onClose?: () => void;
  hideButton?: boolean;
}

interface PublicationRequirement {
  met: boolean;
  message: string;
  type: 'verification' | 'payment' | 'content';
}

export const CampaignPublicationControl = ({
  campaignId,
  campaignName,
  groupId,
  currentStatus,
  enableRosterAttribution,
  onStatusChange,
  triggerOpen = false,
  onClose,
  hideButton = false,
}: CampaignPublicationControlProps) => {
  const [showDialog, setShowDialog] = useState(triggerOpen);

  useEffect(() => {
    if (triggerOpen) {
      setShowDialog(true);
    }
  }, [triggerOpen]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [requirements, setRequirements] = useState<PublicationRequirement[]>([]);
  const { toast } = useToast();

  const checkPublicationRequirements = async () => {
    setChecking(true);
    const reqs: PublicationRequirement[] = [];

    try {
      // Fetch group and organization details
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select(`
          id,
          organization_id,
          use_org_payment_account,
          payment_processor_config,
          organizations!inner(
            id,
            requires_verification,
            verification_status,
            payment_processor_config
          )
        `)
        .eq("id", groupId)
        .single();

      if (groupError || !group) {
        console.error("Error fetching group:", groupError);
        return;
      }

      const org = group.organizations;

      // Check verification requirement
      if (org.requires_verification) {
        const isVerified = org.verification_status === 'approved';
        reqs.push({
          met: isVerified,
          message: isVerified
            ? "Organization is verified"
            : "Organization requires verification before publishing fundraisers",
          type: 'verification',
        });
      }

      // Check payment setup
      const groupConfig = group.payment_processor_config as any;
      const orgConfig = org.payment_processor_config as any;

      let paymentConfigured = false;

      if (group.use_org_payment_account) {
        // Using org-level payment account
        paymentConfigured = orgConfig?.account_enabled === true;
      } else {
        // Using group-level payment account
        paymentConfigured = groupConfig?.account_enabled === true;
      }

      reqs.push({
        met: paymentConfigured,
        message: paymentConfigured
          ? "Payment processing is configured"
          : "Payment account must be configured before publishing fundraisers",
        type: 'payment',
      });

      // Pledge fundraisers have no items — they require pledge setup instead.
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select(`
          pledge_scope,
          pledge_unit_label,
          pledge_event_date,
          pledge_min_per_unit,
          campaign_type:campaign_type_id ( campaign_type )
        `)
        .eq("id", campaignId)
        .maybeSingle();

      const typeName = (campaign as any)?.campaign_type?.campaign_type || "";
      const isPledge = typeof typeName === "string" && typeName.toLowerCase().includes("pledge");

      if (isPledge && !campaignError && campaign) {
        const c = campaign as any;
        const missing: string[] = [];
        if (!c.pledge_scope) missing.push("pledge scope");
        if (!c.pledge_unit_label) missing.push("unit label");
        if (!c.pledge_event_date) missing.push("event date");
        if (c.pledge_min_per_unit === null || c.pledge_min_per_unit === undefined) {
          missing.push("minimum per unit");
        }
        const configured = missing.length === 0;
        reqs.push({
          met: configured,
          message: configured
            ? "Pledge setup is configured"
            : `Pledge setup needs: ${missing.join(", ")}`,
          type: 'content',
        });
      } else {
        const { data: items, error: itemsError } = await supabase
          .from("campaign_items")
          .select("id")
          .eq("campaign_id", campaignId);

        if (!itemsError) {
          const hasItems = (items?.length || 0) > 0;
          reqs.push({
            met: hasItems,
            message: hasItems
              ? "Fundraiser has items configured"
              : "Fundraiser should have at least one item before publishing",
            type: 'content',
          });
        }
      }

      setRequirements(reqs);
    } catch (error) {
      console.error("Error checking requirements:", error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (showDialog) {
      checkPublicationRequirements();
    }
  }, [showDialog, campaignId, groupId]);

  const canPublish = requirements.every(req => req.met);
  const criticalIssues = requirements.filter(req => !req.met && req.type !== 'content');

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ publication_status: newStatus })
        .eq("id", campaignId);

      if (error) throw error;

      // Auto-generate roster links if publishing a roster-attributed campaign
      if (newStatus === 'published' && enableRosterAttribution) {
        try {
          const { data: linkData, error: linkError } = await supabase.functions.invoke('generate-roster-member-links', {
            body: { campaignId }
          });

          if (linkError) {
            console.error('Error auto-generating roster links:', linkError);
          } else if (linkData?.count) {
            console.log(`Auto-generated ${linkData.count} roster member links`);
          }
        } catch (linkError) {
          console.error('Error invoking generate-roster-member-links:', linkError);
          // Don't block the publish process if link generation fails
        }
      }

      toast({
        title: "Success",
        description: `Fundraiser ${newStatus === 'published' ? 'published' : 'saved as draft'} successfully!`,
      });

      onStatusChange();
      setShowDialog(false);
    } catch (error: any) {
      console.error("Error updating campaign status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update fundraiser status",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="gap-1"><Globe className="h-3 w-3" /> Published</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> Pending Verification</Badge>;
      case 'draft':
      default:
        return <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" /> Draft</Badge>;
    }
  };

  const handleDialogChange = (open: boolean) => {
    setShowDialog(open);
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <>
      {!hideButton && (
        <div className="flex items-center gap-2">
          {getStatusBadge(currentStatus)}
          <Button
            variant={currentStatus === 'published' ? 'outline' : 'default'}
            size="sm"
            onClick={() => setShowDialog(true)}
          >
            {currentStatus === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentStatus === 'published' ? 'Unpublish Fundraiser' : 'Publish Fundraiser'}
            </DialogTitle>
            <DialogDescription>
              {currentStatus === 'published'
                ? 'This will make the fundraiser unavailable to the public.'
                : 'This will make your fundraiser live and visible to donors.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {checking ? (
              <div className="text-center py-4 text-muted-foreground">
                Checking requirements...
              </div>
            ) : currentStatus !== 'published' ? (
              <>
                <div className="space-y-2">
                  {requirements.map((req, index) => (
                    <Alert
                      key={index}
                      variant={req.met ? "default" : "destructive"}
                      className="flex items-start gap-3"
                    >
                      {req.met ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                      )}
                      <AlertDescription className="text-sm">
                        {req.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>

                {!canPublish && criticalIssues.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cannot publish:</strong> Please resolve the critical issues above
                      before publishing this fundraiser.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Unpublishing will prevent new donations. Existing fundraiser links will show
                  that the fundraiser has ended.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            {currentStatus === 'published' ? (
              <Button
                variant="destructive"
                onClick={() => handleStatusChange('draft')}
                disabled={loading}
              >
                {loading ? "Unpublishing..." : "Unpublish"}
              </Button>
            ) : (
              <Button
                onClick={() => handleStatusChange('published')}
                disabled={loading || !canPublish}
              >
                {loading ? "Publishing..." : "Publish Fundraiser"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
