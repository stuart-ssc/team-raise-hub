import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Trophy, ShieldCheck, Loader2, CheckCircle2, Info } from "lucide-react";
import { DonorInfoForm, DonorInfo } from "@/components/DonorInfoForm";
import { CustomFieldsRenderer } from "@/components/CustomFieldsRenderer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCampaignPledgers } from "@/hooks/useCampaignPledgers";
import {
  formatHeadline,
  getDaysLeft,
  getVideoEmbedUrl,
  StatTile,
} from "../shared/landingHelpers";
import type { ResolvedBranding } from "@/lib/campaignBranding";
import { BrandedLandingWrapper, BrandLogoStrip } from "../shared/BrandedLandingWrapper";

export interface PledgeCampaign {
  id: string;
  slug?: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  amount_raised: number | null;
  end_date: string | null;
  image_url: string | null;
  hero_accent_word?: string | null;
  fee_model: "donor_covers" | "org_absorbs" | null;
  pledge_unit_label: string | null;
  pledge_unit_label_plural: string | null;
  pledge_scope: "team" | "participant" | null;
  pledge_event_date: string | null;
  pledge_min_per_unit: number | null;
  pledge_suggested_unit_amounts?: number[] | null;
  groups: {
    id?: string;
    organization_id: string;
    group_name: string;
    schools: { school_name: string } | null;
  } | null;
  campaign_type: { name: string } | null;
}

interface AttributedRosterMember {
  id: string;
  firstName: string;
  lastName: string;
  pitchMessage?: string | null;
  pitchImageUrl?: string | null;
  pitchVideoUrl?: string | null;
  pitchRecordedVideoUrl?: string | null;
}

interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
  field_options: any;
  is_required: boolean;
  help_text: string | null;
  display_order: number;
}

type Step = "pledge" | "donor" | "custom" | "review";

interface ParticipantOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  campaign: PledgeCampaign;
  campaignSlug: string;
  attributedRosterMember: AttributedRosterMember | null;
  organizationName: string;
  customFields?: CustomField[];
  // Reasonable estimate for "your pledge" preview
  estimatedUnits?: number;
  branding?: ResolvedBranding;
}

const DEFAULT_AMOUNTS = [1, 2, 5, 10, 25];

export function PledgeLanding({
  campaign,
  campaignSlug,
  attributedRosterMember,
  organizationName,
  customFields = [],
  estimatedUnits,
}: Props) {
  const { toast } = useToast();

  const unitLabel = campaign.pledge_unit_label || "unit";
  const unitLabelPlural = campaign.pledge_unit_label_plural || `${unitLabel}s`;
  const isParticipantScope = campaign.pledge_scope === "participant";
  const minPerUnit = Number(campaign.pledge_min_per_unit) || 1;
  const suggested =
    Array.isArray(campaign.pledge_suggested_unit_amounts) &&
    campaign.pledge_suggested_unit_amounts.length > 0
      ? campaign.pledge_suggested_unit_amounts.map(Number)
      : DEFAULT_AMOUNTS;

  const eventDateLabel = campaign.pledge_event_date
    ? new Date(campaign.pledge_event_date + "T00:00:00").toLocaleDateString(
        undefined,
        { month: "long", day: "numeric", year: "numeric" },
      )
    : "the event";
  const eventDateShort = campaign.pledge_event_date
    ? new Date(campaign.pledge_event_date + "T00:00:00").toLocaleDateString(
        undefined,
        { month: "short", day: "numeric" },
      )
    : null;
  const daysToEvent = getDaysLeft(campaign.pledge_event_date);

  // ── pledger data ──
  const { data: pledgers = [] } = useCampaignPledgers(campaign.id);
  const pledgerCount = pledgers.length;
  const totalEstimated = useMemo(() => {
    // Use server-trusted amount_raised when present; otherwise quick estimate
    if (campaign.amount_raised && Number(campaign.amount_raised) > 0) {
      return Number(campaign.amount_raised);
    }
    const exUnits = estimatedUnits ?? 25;
    return pledgers.reduce((sum, p) => {
      const raw = p.amountPerUnit * exUnits;
      const final = p.maxTotal != null ? Math.min(raw, p.maxTotal) : raw;
      return sum + final;
    }, 0);
  }, [pledgers, estimatedUnits, campaign.amount_raised]);
  const avgPerUnit =
    pledgerCount > 0
      ? pledgers.reduce((s, p) => s + p.amountPerUnit, 0) / pledgerCount
      : 0;

  const goal = Number(campaign.goal_amount || 0);
  const progress = goal > 0 ? Math.min((totalEstimated / goal) * 100, 100) : 0;

  // ── form state ──
  const [step, setStep] = useState<Step>("pledge");
  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantOption | null>(attributedRosterMember);
  const [participants, setParticipants] = useState<ParticipantOption[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const needsParticipantPicker =
    isParticipantScope && !attributedRosterMember;

  useEffect(() => {
    if (!needsParticipantPicker) return;
    let cancelled = false;
    (async () => {
      setParticipantsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-campaign-roster-members",
          { body: { campaignId: campaign.id } },
        );
        if (error) throw error;
        if (!cancelled)
          setParticipants((data?.members as ParticipantOption[]) || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setParticipants([]);
      } finally {
        if (!cancelled) setParticipantsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsParticipantPicker, campaign.id]);

  const [chip, setChip] = useState<number | null>(suggested[1] ?? suggested[0]);
  const [customAmt, setCustomAmt] = useState("");
  const [hasCap, setHasCap] = useState(false);
  const [maxTotal, setMaxTotal] = useState("");
  const [donorInfo, setDonorInfo] = useState<DonorInfo | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const amount = useMemo(() => {
    const c = parseFloat(customAmt);
    if (!Number.isNaN(c) && c > 0) return c;
    return chip ?? 0;
  }, [customAmt, chip]);
  const cap = hasCap ? parseFloat(maxTotal) || 0 : 0;
  const exUnits = estimatedUnits ?? 28;
  const subtotal = useMemo(() => {
    const raw = amount * exUnits;
    return hasCap && cap > 0 ? Math.min(raw, cap) : raw;
  }, [amount, exUnits, hasCap, cap]);
  const platformFee =
    campaign.fee_model === "org_absorbs" ? 0 : subtotal * 0.1;
  const totalEstAuth = subtotal + platformFee;

  const validAmount = amount >= minPerUnit;
  const validParticipant = !isParticipantScope || !!selectedParticipant;
  const canContinue = validAmount && validParticipant && (!hasCap || cap > 0);

  const validateCustomFields = () => {
    const required = customFields.filter((f) => f.is_required);
    return required.every((f) => {
      if (f.field_type === "file") return true;
      const v = customFieldValues[f.id];
      return v !== undefined && v !== null && v !== "";
    });
  };

  const handleStartCheckout = () => {
    if (!canContinue) return;
    setStep("donor");
  };

  const handleDonorComplete = (info: DonorInfo) => {
    setDonorInfo(info);
    if (customFields.length > 0) setStep("custom");
    else setStep("review");
  };

  const handleCustomNext = () => {
    if (!validateCustomFields()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    setStep("review");
  };

  const submit = async () => {
    if (!donorInfo) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-pledge-setup",
        {
          body: {
            campaignSlug,
            amountPerUnit: amount,
            maxTotalAmount: hasCap && cap > 0 ? cap : null,
            attributedRosterMemberId: selectedParticipant?.id || null,
            customerInfo: {
              email: donorInfo.email,
              name: `${donorInfo.firstName} ${donorInfo.lastName}`.trim(),
              phone: donorInfo.phone,
            },
            origin: window.location.origin,
          },
        },
      );
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else throw new Error("No checkout URL returned");
    } catch (err: any) {
      toast({
        title: "Could not start pledge",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  // pitch
  const activePitch = useMemo(() => {
    if (
      attributedRosterMember &&
      (attributedRosterMember.pitchMessage ||
        attributedRosterMember.pitchImageUrl ||
        attributedRosterMember.pitchVideoUrl ||
        attributedRosterMember.pitchRecordedVideoUrl)
    ) {
      return {
        name: `${attributedRosterMember.firstName} ${attributedRosterMember.lastName}`,
        message: attributedRosterMember.pitchMessage,
        imageUrl: attributedRosterMember.pitchImageUrl,
        videoUrl: attributedRosterMember.pitchVideoUrl,
        recordedVideoUrl: attributedRosterMember.pitchRecordedVideoUrl,
      };
    }
    return null;
  }, [attributedRosterMember]);
  const embedUrl = getVideoEmbedUrl(activePitch?.videoUrl);

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative bg-foreground text-background overflow-hidden">
        {campaign.image_url && (
          <div className="absolute inset-0">
            <img
              src={campaign.image_url}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-foreground/80" />
          </div>
        )}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge
              variant="secondary"
              className="bg-background/15 text-background border-0 hover:bg-background/20"
            >
              {campaign.campaign_type?.name || "Pledge"}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-emerald-500/20 text-emerald-100 border-0 hover:bg-emerald-500/25"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 mr-1.5" />
              Counting now
            </Badge>
            {campaign.groups && (
              <span className="flex items-center gap-1 text-background/80">
                <MapPin className="h-4 w-4" />
                {[campaign.groups.schools?.school_name, campaign.groups.group_name].filter(Boolean).join(" • ")}
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl">
            {formatHeadline(campaign.name, campaign.hero_accent_word)}
          </h1>

          {campaign.description && (
            <p className="text-lg text-background/85 max-w-2xl">
              {campaign.description}
            </p>
          )}

          {goal > 0 && (
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-baseline gap-3">
                <span className="font-serif italic text-3xl md:text-4xl text-primary">
                  ${Math.round(totalEstimated).toLocaleString()}
                </span>
                <span className="text-sm text-background/70">
                  {pledgerCount} pledger{pledgerCount === 1 ? "" : "s"}
                </span>
              </div>
              <Progress value={progress} className="h-2 bg-background/15" />
              <div className="flex justify-between text-xs text-background/70">
                <span>{progress.toFixed(0)}% of goal</span>
                <span>Goal ${goal.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <StatTile
              label="Pledged so far"
              value={`$${Math.round(totalEstimated).toLocaleString()}`}
            />
            <StatTile label="Pledgers" value={String(pledgerCount)} />
            <StatTile
              label={`Avg per ${unitLabel}`}
              value={avgPerUnit ? `$${avgPerUnit.toFixed(2)}` : "—"}
            />
            <StatTile
              label="Game day"
              value={eventDateShort || "—"}
              sub={
                daysToEvent != null
                  ? daysToEvent === 0
                    ? "today"
                    : `in ${daysToEvent} days`
                  : undefined
              }
            />
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="max-w-6xl mx-auto px-6 py-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          {/* Roster pitch */}
          {activePitch && (
            <Card className="border-l-4 border-l-primary overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  {activePitch.imageUrl && (
                    <img
                      src={activePitch.imageUrl}
                      alt={activePitch.name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-primary font-semibold flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" /> You're pledging for
                    </p>
                    <h3 className="text-xl font-bold mt-1">
                      {activePitch.name}
                    </h3>
                    {campaign.groups && (
                      <p className="text-sm text-muted-foreground">
                        {[campaign.groups.schools?.school_name, campaign.groups.group_name].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    {activePitch.message && (
                      <blockquote className="mt-3 italic text-muted-foreground border-l-2 border-primary/30 pl-3">
                        "{activePitch.message}"
                      </blockquote>
                    )}
                  </div>
                </div>
                {(activePitch.recordedVideoUrl || embedUrl) && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    {activePitch.recordedVideoUrl ? (
                      <video
                        src={activePitch.recordedVideoUrl}
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                      />
                    ) : (
                      <iframe
                        src={embedUrl!}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* MAKE A PLEDGE */}
          {step === "pledge" && (
            <div>
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
                Make a pledge
              </p>
              <h2 className="text-3xl font-bold mb-2">
                Pick {isParticipantScope ? "a player. " : ""}Pick an{" "}
                <span className="font-serif italic text-primary">amount.</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Your card is authorized but not charged until after{" "}
                {eventDateLabel}. Set a max if you want a hard cap.
              </p>

              <Card>
                <CardContent className="p-5 space-y-5">
                  {needsParticipantPicker && (
                    <div className="space-y-2">
                      <Label>
                        Pledging for <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={selectedParticipant?.id || ""}
                        onValueChange={(val) => {
                          const p = participants.find((x) => x.id === val) || null;
                          setSelectedParticipant(p);
                        }}
                        disabled={participantsLoading || participants.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              participantsLoading
                                ? "Loading participants…"
                                : participants.length === 0
                                  ? "No participants available"
                                  : "Whole team (split across players)"
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
                    <Label>Amount per {unitLabel} made</Label>
                    <div className="flex flex-wrap gap-2">
                      {suggested.map((amt) => {
                        const active = !customAmt && chip === amt;
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => {
                              setChip(amt);
                              setCustomAmt("");
                            }}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted border-border"
                            }`}
                          >
                            ${amt}
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min={minPerUnit}
                        placeholder={`Custom amount per ${unitLabel}`}
                        className="pl-7"
                        value={customAmt}
                        onChange={(e) => {
                          setCustomAmt(e.target.value);
                          setChip(null);
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum ${minPerUnit.toFixed(2)} per {unitLabel}.
                    </p>
                  </div>

                  {/* Live calc */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-4 text-center">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Your pledge
                      </div>
                      <div className="font-serif italic text-2xl text-primary mt-1">
                        ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}
                      </div>
                    </div>
                    <div className="text-muted-foreground self-center">
                      <div className="text-[10px] uppercase tracking-widest mb-1">
                        Avg {unitLabelPlural} / game
                      </div>
                      <div className="font-serif italic text-2xl text-foreground">
                        {exUnits}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Estimated total
                      </div>
                      <div className="font-serif italic text-2xl text-primary mt-1">
                        ${subtotal.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-sm">Set a maximum total</div>
                      <div className="text-xs text-muted-foreground">
                        Cap your charge no matter how many {unitLabelPlural} fall.
                      </div>
                    </div>
                    <Switch checked={hasCap} onCheckedChange={setHasCap} />
                  </div>
                  {hasCap && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        type="number"
                        step="1"
                        min={1}
                        placeholder="Maximum total"
                        className="pl-7"
                        value={maxTotal}
                        onChange={(e) => setMaxTotal(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">
                        Your card won't be charged until after {eventDateLabel}.
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        We'll authorize the card now to confirm your pledge. After the
                        event, you'll get an email showing the final {unitLabel} count
                        and your charge — usually within 24 hours of tip-off.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DONOR INFO */}
          {step === "donor" && (
            <Card>
              <CardContent className="p-5">
                <DonorInfoForm
                  organizationId={campaign.groups?.organization_id || ""}
                  onBack={() => setStep("pledge")}
                  onComplete={handleDonorComplete}
                />
              </CardContent>
            </Card>
          )}

          {/* CUSTOM FIELDS */}
          {step === "custom" && customFields.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-xl font-bold">Additional information</h3>
                <CustomFieldsRenderer
                  fields={customFields as any}
                  values={customFieldValues}
                  onChange={(fieldId, value) =>
                    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: value }))
                  }
                />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep("donor")}>
                    Back
                  </Button>
                  <Button onClick={handleCustomNext}>Continue</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* REVIEW */}
          {step === "review" && donorInfo && (
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-xl font-bold">Review &amp; authorize</h3>
                <div className="rounded-md border p-4 space-y-2 text-sm">
                  <Row label="Pledge">
                    ${amount.toFixed(2)} per {unitLabel}
                  </Row>
                  <Row label="Maximum">
                    {hasCap && cap > 0 ? `$${cap.toFixed(2)}` : "No cap"}
                  </Row>
                  <Row label="Charge date">After {eventDateLabel}</Row>
                  <Row label="Donor">
                    {donorInfo.firstName} {donorInfo.lastName}
                  </Row>
                  {selectedParticipant && (
                    <Row label="Supporting">
                      {selectedParticipant.firstName} {selectedParticipant.lastName}
                    </Row>
                  )}
                </div>
                <div className="rounded-md border-2 border-primary/30 bg-primary/5 p-4 text-sm">
                  <p className="font-medium mb-1 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Authorization
                  </p>
                  <p className="text-muted-foreground">
                    By submitting, you authorize {organizationName} to charge your
                    card ${amount.toFixed(2)} per {unitLabel} on or after{" "}
                    {eventDateLabel}
                    {hasCap && cap > 0
                      ? `, up to a maximum total of $${cap.toFixed(2)}`
                      : ", with no cap"}
                    . You'll receive a receipt after the charge.
                  </p>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(customFields.length > 0 ? "custom" : "donor")}
                    disabled={submitting}
                  >
                    Back
                  </Button>
                  <Button onClick={submit} disabled={submitting}>
                    {submitting && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Authorize pledge
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* LEADERBOARD */}
          {pledgers.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
                Top pledgers
              </p>
              <h2 className="text-3xl font-bold mb-4">
                The <span className="font-serif italic text-primary">leaderboard.</span>
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Pledges already secured for the event.
              </p>
              <Card>
                <CardContent className="p-0">
                  {pledgers.slice(0, 5).map((p, i) => {
                    const initials = p.customerName
                      .split(" ")
                      .map((s) => s[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const exUnitsRow = exUnits;
                    const raw = p.amountPerUnit * exUnitsRow;
                    const est =
                      p.maxTotal != null ? Math.min(raw, p.maxTotal) : raw;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-4 px-5 py-4 ${
                          i > 0 ? "border-t" : ""
                        }`}
                      >
                        <div className="font-serif italic text-muted-foreground w-6 text-sm">
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {initials || "·"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {p.customerName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            ${p.amountPerUnit.toFixed(2)}/{unitLabel}
                            {p.maxTotal != null
                              ? ` · max $${p.maxTotal.toFixed(0)}`
                              : ""}
                            {p.attributedName ? ` · for ${p.attributedName}` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            est. {exUnitsRow} {unitLabelPlural}
                          </div>
                          <div className="font-serif italic text-primary text-lg">
                            ${est.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="lg:sticky lg:top-6 self-start">
          <Card className="overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-semibold">Your pledge</span>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <div className="font-medium">
                    {selectedParticipant
                      ? `${selectedParticipant.firstName} ${selectedParticipant.lastName}`
                      : "Whole team"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${amount.toFixed(2)}/{unitLabel} · est. {exUnits}{" "}
                    {unitLabelPlural}
                  </div>
                </div>
                <div className="font-semibold tabular-nums">
                  ${subtotal.toFixed(0)}
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <div className="font-medium">Max cap</div>
                  <div className="text-xs text-muted-foreground">Hard limit</div>
                </div>
                <div className="font-semibold tabular-nums">
                  {hasCap && cap > 0 ? `$${cap.toFixed(0)}` : "No cap"}
                </div>
              </div>

              <hr />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated subtotal</span>
                  <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (10%)</span>
                  <span className="tabular-nums">${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Charged after</span>
                  <span>{eventDateShort || "event"}</span>
                </div>
              </div>

              <hr />

              <div className="flex justify-between items-baseline">
                <span className="font-bold">Est. auth amount</span>
                <span className="font-bold text-lg tabular-nums">
                  ${totalEstAuth.toFixed(2)}
                </span>
              </div>

              {campaign.fee_model !== "org_absorbs" && (
                <div className="rounded-md bg-muted/50 p-3 text-xs flex gap-2">
                  <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    The 10% platform fee covers card processing and keeps Sponsorly
                    running. By covering it, 100% of your pledge reaches the team.
                  </span>
                </div>
              )}

              {step === "pledge" ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStartCheckout}
                  disabled={!canContinue}
                >
                  Continue to checkout
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={() => setStep("pledge")}
                  disabled={submitting}
                >
                  Edit pledge
                </Button>
              )}

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                You'll only be charged for {unitLabelPlural} actually made.
              </p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
