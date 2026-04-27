import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, ChevronRight } from "lucide-react";
import { DonorInfoForm, DonorInfo } from "@/components/DonorInfoForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PledgePurchaseFlowProps {
  campaign: {
    id: string;
    name: string;
    group_id: string;
    pledge_unit_label: string | null;
    pledge_unit_label_plural: string | null;
    pledge_scope: 'team' | 'participant' | null;
    pledge_event_date: string | null;
    pledge_min_per_unit: number | null;
    pledge_suggested_unit_amounts: number[] | null;
    fee_model: 'donor_covers' | 'org_absorbs' | null;
    groups: { organization_id: string; group_name: string } | null;
  };
  organizationName: string;
  attributedRosterMember: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

const PLATFORM_FEE = 0.10;

interface ParticipantOption {
  id: string;
  firstName: string;
  lastName: string;
}

export function PledgePurchaseFlow({
  campaign,
  organizationName,
  attributedRosterMember,
}: PledgePurchaseFlowProps) {
  const { toast } = useToast();
  const unitLabel = campaign.pledge_unit_label || "unit";
  const unitLabelPlural = campaign.pledge_unit_label_plural || `${unitLabel}s`;
  const isParticipantScope = campaign.pledge_scope === 'participant';
  const suggested = campaign.pledge_suggested_unit_amounts || [0.5, 1, 2, 5];
  const minPerUnit = Number(campaign.pledge_min_per_unit) || 0;
  const eventDateStr = campaign.pledge_event_date
    ? new Date(campaign.pledge_event_date + "T00:00:00").toLocaleDateString(undefined, {
        month: "long", day: "numeric", year: "numeric",
      })
    : "the event date";

  const needsParticipantPick = isParticipantScope && !attributedRosterMember;
  const [step, setStep] = useState<'participant' | 'amount' | 'donor' | 'review'>(
    needsParticipantPick ? 'participant' : 'amount'
  );
  const [selectedRosterMember, setSelectedRosterMember] = useState<ParticipantOption | null>(
    attributedRosterMember
  );
  const [participants, setParticipants] = useState<ParticipantOption[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [amountPerUnit, setAmountPerUnit] = useState<string>("");
  const [hasCap, setHasCap] = useState(false);
  const [maxTotal, setMaxTotal] = useState<string>("");
  const [donorInfo, setDonorInfo] = useState<DonorInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch active roster members for this campaign's group when picker is needed
  useEffect(() => {
    if (!needsParticipantPick || !campaign.group_id) return;
    let cancelled = false;
    (async () => {
      setParticipantsLoading(true);
      try {
        const { data: rosters, error: rErr } = await supabase
          .from("rosters")
          .select("id")
          .eq("group_id", campaign.group_id);
        if (rErr) throw rErr;
        const rosterIds = (rosters || []).map((r: any) => r.id);
        if (rosterIds.length === 0) {
          if (!cancelled) setParticipants([]);
          return;
        }
        const { data: members, error: mErr } = await supabase
          .from("organization_user")
          .select("id, user_id")
          .in("roster_id", rosterIds)
          .eq("active_user", true);
        if (mErr) throw mErr;
        const userIds = (members || []).map((m: any) => m.user_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);
        const profMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
        profiles?.forEach((p: any) => { profMap[p.id] = p; });
        const list: ParticipantOption[] = (members || [])
          .map((m: any) => {
            const p = profMap[m.user_id];
            if (!p) return null;
            return {
              id: m.id,
              firstName: p.first_name || "",
              lastName: p.last_name || "",
            };
          })
          .filter(Boolean) as ParticipantOption[];
        list.sort((a, b) =>
          (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName)
        );
        if (!cancelled) setParticipants(list);
      } catch (err) {
        console.error("Error loading participants:", err);
        if (!cancelled) setParticipants([]);
      } finally {
        if (!cancelled) setParticipantsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [needsParticipantPick, campaign.group_id]);

  const filteredParticipants = useMemo(() => {
    const q = participantSearch.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
    );
  }, [participants, participantSearch]);

  const amountNum = parseFloat(amountPerUnit) || 0;
  const maxNum = hasCap ? parseFloat(maxTotal) || 0 : 0;

  const previewExample = useMemo(() => {
    if (amountNum <= 0) return null;
    const exampleUnits = 25;
    const raw = amountNum * exampleUnits;
    const final = hasCap && maxNum > 0 ? Math.min(raw, maxNum) : raw;
    return { exampleUnits, raw, final, capped: hasCap && maxNum > 0 && raw > maxNum };
  }, [amountNum, hasCap, maxNum]);

  const mandateText = useMemo(() => {
    const capPart = hasCap && maxNum > 0
      ? `, up to a maximum total of $${maxNum.toFixed(2)}`
      : ", with no cap";
    return `By submitting, you authorize ${organizationName} to charge your card $${amountNum.toFixed(2)} per ${unitLabel} on or after ${eventDateStr}${capPart}.`;
  }, [organizationName, amountNum, unitLabel, eventDateStr, hasCap, maxNum]);

  const canContinueAmount = amountNum > 0 && amountNum >= minPerUnit && (!hasCap || maxNum > 0);

  const submit = async () => {
    if (!donorInfo) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-pledge-setup", {
        body: {
          campaign_id: campaign.id,
          amount_per_unit: amountNum,
          max_total_amount: hasCap && maxNum > 0 ? maxNum : null,
          attributed_roster_member_id: selectedRosterMember?.id || null,
          donor: donorInfo,
          mandate_text: mandateText,
          success_url: `${window.location.origin}/pledge/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: window.location.href,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({
        title: "Could not start pledge",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pledge to {organizationName}</CardTitle>
          <CardDescription>
            {isParticipantScope && selectedRosterMember
              ? `You're supporting ${selectedRosterMember.firstName} ${selectedRosterMember.lastName}. `
              : ""}
            Pledge an amount per {unitLabel}. Your card won't be charged until after {eventDateStr}.
          </CardDescription>
          {isParticipantScope && selectedRosterMember && !attributedRosterMember && step !== 'participant' && (
            <button
              type="button"
              className="text-sm text-primary hover:underline self-start"
              onClick={() => setStep('participant')}
            >
              Change participant
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'participant' && (
            <div className="space-y-4">
              <div>
                <Label className="text-base">Who are you pledging for?</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select the participant you want to support.
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name…"
                  className="pl-9"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                />
              </div>
              <div className="border rounded-md max-h-80 overflow-y-auto divide-y">
                {participantsLoading ? (
                  <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading participants…
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    {participants.length === 0
                      ? "No participants found for this fundraiser."
                      : "No matches for your search."}
                  </div>
                ) : (
                  filteredParticipants.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedRosterMember(p);
                        setStep('amount');
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium">{p.firstName} {p.lastName}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 'amount' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Amount per {unitLabel}</Label>
                <div className="flex flex-wrap gap-2">
                  {suggested.map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant={amountNum === amt ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmountPerUnit(String(amt))}
                    >
                      ${amt.toFixed(2)}
                    </Button>
                  ))}
                </div>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min={minPerUnit || 0}
                    placeholder="Custom amount"
                    className="pl-7"
                    value={amountPerUnit}
                    onChange={(e) => setAmountPerUnit(e.target.value)}
                  />
                </div>
                {minPerUnit > 0 && (
                  <p className="text-xs text-muted-foreground">Minimum ${minPerUnit.toFixed(2)} per {unitLabel}.</p>
                )}
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cap-toggle" className="cursor-pointer">Set a maximum total?</Label>
                  <Switch id="cap-toggle" checked={hasCap} onCheckedChange={setHasCap} />
                </div>
                {hasCap && (
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Maximum total"
                      className="pl-7"
                      value={maxTotal}
                      onChange={(e) => setMaxTotal(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {previewExample && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-1 text-sm">
                    <div className="font-medium">Example</div>
                    <div className="text-muted-foreground">
                      For {previewExample.exampleUnits} {unitLabelPlural}, you'd be charged{" "}
                      <strong className="text-foreground">${previewExample.final.toFixed(2)}</strong>
                      {previewExample.capped && (
                        <Badge variant="secondary" className="ml-2">Capped</Badge>
                      )}
                    </div>
                    {campaign.fee_model === 'donor_covers' && (
                      <div className="text-xs text-muted-foreground">
                        A 10% platform fee will be added at charge time.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep('donor')}
                  disabled={!canContinueAmount || (isParticipantScope && !selectedRosterMember)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'donor' && (
            <DonorInfoForm
              organizationId={campaign.groups?.organization_id || ""}
              onBack={() => setStep('amount')}
              onComplete={(info) => {
                setDonorInfo(info);
                setStep('review');
              }}
            />
          )}

          {step === 'review' && donorInfo && (
            <div className="space-y-4">
              <div className="rounded-md border p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pledge</span>
                  <span className="font-medium">${amountNum.toFixed(2)} per {unitLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maximum</span>
                  <span className="font-medium">{hasCap && maxNum > 0 ? `$${maxNum.toFixed(2)}` : "No cap"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Charge date</span>
                  <span className="font-medium">After {eventDateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Donor</span>
                  <span className="font-medium">{donorInfo.firstName} {donorInfo.lastName}</span>
                </div>
                {selectedRosterMember && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supporting</span>
                    <span className="font-medium">{selectedRosterMember.firstName} {selectedRosterMember.lastName}</span>
                  </div>
                )}
              </div>

              <div className="rounded-md border-2 border-primary/30 bg-primary/5 p-4 text-sm">
                <p className="font-medium mb-1">Authorization</p>
                <p className="text-muted-foreground">{mandateText}</p>
                <p className="text-muted-foreground mt-2">
                  Your card will be saved securely with Stripe. You won't be charged today. You can cancel any time before charge using the link in your confirmation email.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('donor')} disabled={submitting}>
                  Back
                </Button>
                <Button onClick={submit} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Authorize pledge
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}