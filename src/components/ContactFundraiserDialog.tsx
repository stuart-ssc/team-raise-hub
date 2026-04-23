import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Search, Send, ArrowLeft, Calendar, Mail, AlertCircle } from "lucide-react";
import { computeOutreachSchedule, stageLabel, type DripStage } from "@/lib/fundraiserOutreachSchedule";

interface Campaign {
  id: string;
  name: string;
  slug: string | null;
  end_date: string | null;
  image_url: string | null;
  goal_amount: number | null;
  amount_raised: number | null;
  enable_roster_attribution: boolean | null;
  group_id: string | null;
  groups?: { group_name: string | null } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorIds?: string[];
  listId?: string;
  onComplete?: () => void;
}

export default function ContactFundraiserDialog({
  open,
  onOpenChange,
  donorIds,
  listId,
  onComplete,
}: Props) {
  const { toast } = useToast();
  const { organizationUser } = useOrganizationUser();
  const { activeGroup } = useActiveGroup();
  const [step, setStep] = useState<"pick" | "review">("pick");
  const [search, setSearch] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("pick");
      setSelected(null);
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !organizationUser) return;
    void fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, organizationUser?.organization_id, activeGroup?.id]);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      let query = supabase
        .from("campaigns")
        .select(
          "id, name, slug, end_date, image_url, goal_amount, amount_raised, enable_roster_attribution, group_id, groups:group_id(group_name)"
        )
        .eq("publication_status", "published")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (activeGroup?.id) {
        query = query.eq("group_id", activeGroup.id);
      } else {
        // scope to org via groups
        const { data: orgGroups } = await supabase
          .from("groups")
          .select("id")
          .eq("organization_id", organizationUser!.organization_id);
        const ids = (orgGroups || []).map((g: any) => g.id);
        if (ids.length > 0) query = query.in("group_id", ids);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCampaigns((data || []) as any);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to load campaigns", description: err.message, variant: "destructive" });
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const filteredCampaigns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.groups?.group_name?.toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  const schedule = useMemo(() => {
    if (!selected?.end_date) return [];
    return computeOutreachSchedule(new Date(selected.end_date));
  }, [selected]);

  const recipientCount = donorIds?.length ?? null;

  const handleEnroll = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("enroll-fundraiser-outreach", {
        body: {
          campaignId: selected.id,
          donorIds,
          listId,
        },
      });
      if (error) throw error;
      const r = (data as any) || {};
      toast({
        title: "Outreach started",
        description: `Enrolled ${r.enrolled ?? 0} donors${
          r.reactivated ? ` (${r.reactivated} reactivated)` : ""
        }. ${r.totalScheduled ?? 0} emails scheduled. Skipped: ${
          (r.skippedSuppressed ?? 0) + (r.skippedNoEmail ?? 0) + (r.skippedAlreadyDonated ?? 0)
        }.`,
      });
      onOpenChange(false);
      onComplete?.();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Failed to enroll",
        description: err.message || "Could not start outreach",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isEnded = (c: Campaign) => !c.end_date || new Date(c.end_date).getTime() <= Date.now();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {step === "pick" ? "Contact about a Fundraiser" : "Review & Start Outreach"}
          </DialogTitle>
          <DialogDescription>
            {step === "pick"
              ? "Pick a published fundraiser. We'll automatically email selected donors with a branded drip campaign."
              : "Confirm the cadence below. Emails stop automatically when each donor donates or the fundraiser ends."}
          </DialogDescription>
        </DialogHeader>

        {step === "pick" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fundraisers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {loadingCampaigns ? (
              <div className="space-y-2">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No published fundraisers found.</p>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredCampaigns.map((c) => {
                  const ended = isEnded(c);
                  return (
                    <Card
                      key={c.id}
                      className={`p-3 flex gap-3 items-center transition-colors ${
                        ended ? "opacity-50" : "cursor-pointer hover:border-primary"
                      }`}
                      onClick={() => {
                        if (ended) return;
                        setSelected(c);
                        setStep("review");
                      }}
                    >
                      {c.image_url ? (
                        <img
                          src={c.image_url}
                          alt=""
                          className="h-14 w-14 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded bg-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        {c.groups?.group_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {c.groups.group_name}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {c.end_date && (
                            <Badge variant={ended ? "secondary" : "outline"} className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {ended ? "Ended" : `Ends ${format(new Date(c.end_date), "MMM d")}`}
                            </Badge>
                          )}
                          {c.enable_roster_attribution && (
                            <Badge variant="outline" className="text-xs">Roster-enabled</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === "review" && selected && (
          <div className="space-y-4">
            <Card className="p-3 flex gap-3 items-center">
              {selected.image_url && (
                <img src={selected.image_url} alt="" className="h-12 w-12 rounded object-cover" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{selected.name}</p>
                {selected.end_date && (
                  <p className="text-xs text-muted-foreground">
                    Ends {format(new Date(selected.end_date), "PPP")}
                  </p>
                )}
              </div>
            </Card>

            <div className="rounded-md border p-3 bg-muted/30">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Drip cadence
              </p>
              {schedule.length === 0 ? (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  This fundraiser ends too soon to schedule outreach.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    {schedule.length} email{schedule.length === 1 ? "" : "s"} per donor, ending when they donate
                    or the fundraiser closes.
                  </p>
                  <ol className="space-y-1">
                    {schedule.map((s, i) => (
                      <li key={i} className="text-xs flex items-center gap-2">
                        <Badge variant="outline" className="text-xs w-6 justify-center">
                          {i + 1}
                        </Badge>
                        <span className="font-medium">{stageLabel[s.stage as DripStage]}</span>
                        <span className="text-muted-foreground">
                          · {format(new Date(s.sendAt), "MMM d, p")}
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>

            <div className="rounded-md border p-3">
              <p className="text-sm">
                Recipients:{" "}
                <span className="font-semibold">
                  {recipientCount !== null ? `${recipientCount} selected donor${recipientCount === 1 ? "" : "s"}` : "all members of this list"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Donors who already donated, opted out, or are suppressed will be skipped automatically.
                Emails lead with the student (when known), then the team — and are clearly powered by Sponsorly.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "review" ? (
            <>
              <Button variant="outline" onClick={() => setStep("pick")} disabled={submitting}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleEnroll} disabled={submitting || schedule.length === 0}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Start outreach
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}