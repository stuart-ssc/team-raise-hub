import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [step, setStep] = useState<'amount' | 'donor' | 'review'>('amount');
  const [selectedRosterMember, setSelectedRosterMember] = useState<ParticipantOption | null>(
    attributedRosterMember
  );
  const [participants, setParticipants] = useState<ParticipantOption[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [amountPerUnit, setAmountPerUnit] = useState<string>("");
  const [hasCap, setHasCap] = useState(false);
  const [maxTotal, setMaxTotal] = useState<string>("");
  const [donorInfo, setDonorInfo] = useState<DonorInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch active roster members for this campaign's group when picker is needed
  useEffect(() => {
    if (!needsParticipantPick || !campaign.id) return;
    let cancelled = false;
    (async () => {
      setParticipantsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-campaign-roster-members",
          { body: { campaignId: campaign.id } }
        );
        if (error) throw error;
        const list: ParticipantOption[] = (data?.members || []) as ParticipantOption[];
        if (!cancelled) setParticipants(list);
      } catch (err) {
        console.error("Error loading participants:", err);
        if (!cancelled) setParticipants([]);
      } finally {
        if (!cancelled) setParticipantsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [needsParticipantPick, campaign.id]);

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
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'amount' && (
            <div className="space-y-5">
              {needsParticipantPick && (
                <div className="space-y-2">
                  <Label htmlFor="participant-select">
                    Pledging for <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedRosterMember?.id || ""}
                    onValueChange={(val) => {
                      const p = participants.find((x) => x.id === val) || null;
                      setSelectedRosterMember(p);
                    }}
                    disabled={participantsLoading || participants.length === 0}
                  >
                    <SelectTrigger id="participant-select">
                      <SelectValue
                        placeholder={
                          participantsLoading
                            ? "Loading participants…"
                            : participants.length === 0
                              ? "No participants available"
                              : "Select a participant"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {participants.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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