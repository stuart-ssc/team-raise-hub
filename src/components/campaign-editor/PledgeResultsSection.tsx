import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Check, Clock } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface PledgeResultsSectionProps {
  campaignId: string;
  pledgeScope: 'team' | 'participant';
  pledgeUnitLabel: string;
  pledgeUnitLabelPlural: string;
}

interface PledgeRow {
  id: string;
  status: string;
  amount_per_unit: number;
  max_total_amount: number | null;
  customer_name: string | null;
  attributed_roster_member_id: string | null;
  roster_member_name?: string | null;
}

export function PledgeResultsSection({
  campaignId,
  pledgeScope,
  pledgeUnitLabel,
  pledgeUnitLabelPlural,
}: PledgeResultsSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pledges, setPledges] = useState<PledgeRow[]>([]);
  const [teamUnits, setTeamUnits] = useState<string>("");
  const [memberUnits, setMemberUnits] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const unitLabel = pledgeUnitLabel || "unit";
  const unitLabelPlural = pledgeUnitLabelPlural || `${unitLabel}s`;

  const loadPledges = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pledges" as any)
      .select("id, status, amount_per_unit, max_total_amount, customer_name, attributed_roster_member_id")
      .eq("campaign_id", campaignId);

    if (error) {
      console.error(error);
      setPledges([]);
      setLoading(false);
      return;
    }

    const memberIds = Array.from(
      new Set(((data as any[]) || []).map((p) => p.attributed_roster_member_id).filter(Boolean))
    );

    let nameMap: Record<string, string> = {};
    if (memberIds.length > 0) {
      const { data: members } = await supabase
        .from("organization_user")
        .select("id, profiles:user_id(first_name, last_name)")
        .in("id", memberIds as string[]);
      ((members as any[]) || []).forEach((m) => {
        const p = m.profiles;
        nameMap[m.id] = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() : "Member";
      });
    }

    setPledges(
      ((data as any[]) || []).map((p) => ({
        ...p,
        roster_member_name: p.attributed_roster_member_id
          ? nameMap[p.attributed_roster_member_id] || "Member"
          : null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    loadPledges();
  }, [campaignId]);

  const activePledges = useMemo(
    () => pledges.filter((p) => p.status === "active" || p.status === "requires_action"),
    [pledges]
  );

  const stats = useMemo(() => {
    const charged = pledges.filter((p) => p.status === "charged").length;
    const failed = pledges.filter((p) => p.status === "failed").length;
    const requires = pledges.filter((p) => p.status === "requires_action").length;
    const active = activePledges.length;
    return { charged, failed, requires, active, total: pledges.length };
  }, [pledges, activePledges]);

  const memberPledgeMap = useMemo(() => {
    const map: Record<string, PledgeRow[]> = {};
    activePledges.forEach((p) => {
      const k = p.attributed_roster_member_id || "_unattributed";
      (map[k] ||= []).push(p);
    });
    return map;
  }, [activePledges]);

  const estimatedTotal = useMemo(() => {
    if (pledgeScope === "team") {
      const u = parseFloat(teamUnits || "0") || 0;
      return activePledges.reduce((sum, p) => {
        const raw = p.amount_per_unit * u;
        const final = p.max_total_amount ? Math.min(raw, p.max_total_amount) : raw;
        return sum + final;
      }, 0);
    }
    let sum = 0;
    Object.entries(memberPledgeMap).forEach(([memberId, list]) => {
      const u = parseFloat(memberUnits[memberId] || "0") || 0;
      list.forEach((p) => {
        const raw = p.amount_per_unit * u;
        const final = p.max_total_amount ? Math.min(raw, p.max_total_amount) : raw;
        sum += final;
      });
    });
    return sum;
  }, [activePledges, teamUnits, memberUnits, pledgeScope, memberPledgeMap]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const results =
        pledgeScope === "team"
          ? [{ scope: "team", units: parseFloat(teamUnits || "0") }]
          : Object.entries(memberUnits).map(([memberId, units]) => ({
              scope: "participant",
              attributed_roster_member_id: memberId,
              units: parseFloat(units || "0"),
            }));

      const { error } = await supabase.functions.invoke("record-pledge-results", {
        body: { campaign_id: campaignId, results },
      });
      if (error) throw error;

      toast({
        title: "Results recorded",
        description: "We're charging supporters now. Refresh to see live status.",
      });
      setConfirmOpen(false);
      setConfirmText("");
      setTimeout(loadPledges, 2000);
    } catch (err: any) {
      toast({
        title: "Failed to record results",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Active</div>
          <div className="text-2xl font-bold">{stats.active}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Charged</div>
          <div className="text-2xl font-bold text-green-600">{stats.charged}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Needs Action</div>
          <div className="text-2xl font-bold text-amber-600">{stats.requires}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Failed</div>
          <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
        </CardContent></Card>
      </div>

      {activePledges.length === 0 && stats.total === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          No pledges yet. Once supporters pledge, you'll be able to record results here after your event.
        </CardContent></Card>
      )}

      {activePledges.length > 0 && (
        <>
          {pledgeScope === "team" ? (
            <div className="space-y-2">
              <Label htmlFor="teamUnits">Total {unitLabelPlural} for the team</Label>
              <Input
                id="teamUnits"
                type="number"
                step="0.01"
                min="0"
                placeholder={`e.g. 25 ${unitLabelPlural}`}
                value={teamUnits}
                onChange={(e) => setTeamUnits(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Units per participant</Label>
              <div className="border rounded-md divide-y">
                {Object.entries(memberPledgeMap).map(([memberId, list]) => {
                  const memberName = list[0].roster_member_name || "Unattributed";
                  return (
                    <div key={memberId} className="flex items-center justify-between gap-3 p-3">
                      <div>
                        <div className="font-medium">{memberName}</div>
                        <div className="text-xs text-muted-foreground">
                          {list.length} pledge{list.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-32"
                        placeholder={unitLabelPlural}
                        value={memberUnits[memberId] || ""}
                        onChange={(e) =>
                          setMemberUnits((prev) => ({ ...prev, [memberId]: e.target.value }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Card className="bg-muted/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Estimated total to charge</div>
                <div className="text-2xl font-bold">${estimatedTotal.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Caps and Stripe fees applied per pledge.</div>
              </div>
              <Button onClick={() => setConfirmOpen(true)} disabled={estimatedTotal <= 0}>
                Record Final Results
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Charge all supporters?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately charge {activePledges.length} supporter
              {activePledges.length === 1 ? "" : "s"} for an estimated{" "}
              <strong>${estimatedTotal.toFixed(2)}</strong>. This cannot be undone.
              <br /><br />
              Type <strong>CHARGE</strong> below to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type CHARGE"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                submit();
              }}
              disabled={confirmText !== "CHARGE" || submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Charge supporters"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}