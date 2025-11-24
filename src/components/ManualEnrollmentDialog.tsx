import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BusinessMatchPreview } from "./BusinessMatchPreview";
import { getAllBusinessesWithMatchInfo, getMatchingBusinesses, BusinessWithInsights, MatchResult } from "@/lib/campaignMatching";
import { Loader2, Search } from "lucide-react";

interface ManualEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  preSelectedBusinessIds?: string[];
  onSuccess?: () => void;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  campaign_type: string;
}

export function ManualEnrollmentDialog({
  open,
  onOpenChange,
  organizationId,
  preSelectedBusinessIds = [],
  onSuccess,
}: ManualEnrollmentDialogProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [mode, setMode] = useState<"matching" | "manual">("matching");
  const [businesses, setBusinesses] = useState<(BusinessWithInsights & { matchResult: MatchResult })[]>([]);
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>(preSelectedBusinessIds);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Load campaigns
  useEffect(() => {
    if (open) {
      loadCampaigns();
    }
  }, [open, organizationId]);

  // Load businesses when campaign or mode changes
  useEffect(() => {
    if (selectedCampaignId) {
      loadBusinesses();
    }
  }, [selectedCampaignId, mode]);

  // Update selected businesses when pre-selected IDs change
  useEffect(() => {
    setSelectedBusinessIds(preSelectedBusinessIds);
  }, [preSelectedBusinessIds]);

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from("business_nurture_campaigns")
      .select("id, name, status, campaign_type")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("name");

    if (error) {
      toast.error("Failed to load campaigns");
      return;
    }

    setCampaigns(data || []);
  };

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      if (mode === "matching") {
        const matchingBusinesses = await getMatchingBusinesses(organizationId, selectedCampaignId);
        const businessesWithMatch = matchingBusinesses.map((business) => ({
          ...business,
          matchResult: { matches: true, reasons: [], warnings: [], score: 100 },
        }));
        setBusinesses(businessesWithMatch);
      } else {
        const allBusinesses = await getAllBusinessesWithMatchInfo(organizationId, selectedCampaignId);
        setBusinesses(allBusinesses);
      }
    } catch (error) {
      console.error("Error loading businesses:", error);
      toast.error("Failed to load businesses");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (selectedBusinessIds.length === 0) {
      toast.error("Please select at least one business");
      return;
    }

    setEnrolling(true);
    let successCount = 0;
    let errorCount = 0;
    let reactivatedCount = 0;

    for (const businessId of selectedBusinessIds) {
      try {
        const { data, error } = await supabase.functions.invoke("trigger-business-campaign", {
          body: {
            businessId,
            campaignId: selectedCampaignId,
          },
        });

        if (error) throw error;

        if (data?.reactivated) {
          reactivatedCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error("Error enrolling business:", businessId, error);
        errorCount++;
      }
    }

    setEnrolling(false);

    if (successCount > 0 || reactivatedCount > 0) {
      let message = "";
      if (successCount > 0) message += `${successCount} new enrollment${successCount > 1 ? "s" : ""}`;
      if (reactivatedCount > 0) {
        if (message) message += ", ";
        message += `${reactivatedCount} reactivated`;
      }
      toast.success(`Successfully enrolled: ${message}`);
      onSuccess?.();
      onOpenChange(false);
    }

    if (errorCount > 0) {
      toast.error(`Failed to enroll ${errorCount} business${errorCount > 1 ? "es" : ""}`);
    }
  };

  const filteredBusinesses = businesses.filter((business) =>
    business.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.business_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchingCount = filteredBusinesses.filter((b) => b.matchResult.matches).length;
  const selectedCount = selectedBusinessIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manual Campaign Enrollment</DialogTitle>
          <DialogDescription>
            Select a campaign and businesses to enroll
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label>Campaign</Label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCampaignId && (
            <>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as "matching" | "manual")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="matching" id="matching" />
                  <Label htmlFor="matching" className="font-normal cursor-pointer">
                    Show matching businesses only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="font-normal cursor-pointer">
                    Select any business manually
                  </Label>
                </div>
              </RadioGroup>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {filteredBusinesses.length} businesses
                {mode === "manual" && ` (${matchingCount} match criteria)`}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-2 pb-4">
                    {filteredBusinesses.map((business) => (
                      <BusinessMatchPreview
                        key={business.id}
                        business={business}
                        selected={selectedBusinessIds.includes(business.id)}
                        onSelect={(selected) => {
                          if (selected) {
                            setSelectedBusinessIds([...selectedBusinessIds, business.id]);
                          } else {
                            setSelectedBusinessIds(selectedBusinessIds.filter((id) => id !== business.id));
                          }
                        }}
                        showMatchDetails={mode === "manual"}
                      />
                    ))}
                    {filteredBusinesses.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {mode === "matching" 
                          ? "No businesses match the campaign criteria"
                          : "No businesses found"}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Selected: {selectedCount} business{selectedCount !== 1 ? "es" : ""}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEnroll} 
                disabled={selectedCount === 0 || enrolling}
              >
                {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
                Enroll {selectedCount > 0 ? `${selectedCount} ` : ""}Business{selectedCount !== 1 ? "es" : ""}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
