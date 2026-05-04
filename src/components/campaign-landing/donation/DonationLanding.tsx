import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin,
  Heart,
  Trophy,
  Loader2,
  LogIn,
  RefreshCw,
} from "lucide-react";
import { DonorInfoForm, DonorInfo } from "@/components/DonorInfoForm";
import { BusinessInfoForm } from "@/components/BusinessInfoForm";
import { CustomFieldsRenderer } from "@/components/CustomFieldsRenderer";
import { useCampaignDonors } from "@/hooks/useCampaignDonors";
import { formatHeadline, getDaysLeft, getVideoEmbedUrl, StatTile } from "../shared/landingHelpers";

// ───────────────────────────── types ─────────────────────────────

export interface DonationCampaign {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  amount_raised: number | null;
  end_date: string | null;
  image_url: string | null;
  hero_accent_word?: string | null;
  fee_model: "donor_covers" | "org_absorbs" | null;
  donation_suggested_amounts?: number[] | null;
  donation_min_amount?: number | null;
  donation_allow_recurring?: boolean | null;
  donation_allow_dedication?: boolean | null;
  donation_allocations?: Array<{ percent: number; label: string; description?: string; amount?: number }> | null;
  groups: {
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

export interface DonationSelection {
  amount: number;
  isRecurring: boolean;
  dedicationType: "in_honor_of" | "in_memory_of" | null;
  dedicationName: string | null;
}

type CheckoutStep = 'cart' | 'donor-info' | 'business-info' | 'custom-fields' | 'payment';

interface Props {
  campaign: DonationCampaign;
  attributedRosterMember: AttributedRosterMember | null;
  onProceedToCheckout: (selection: DonationSelection) => void;
  // Reused checkout-step state
  checkoutStep?: CheckoutStep;
  setCheckoutStep?: (s: CheckoutStep) => void;
  donorInfo?: DonorInfo | null;
  onDonorInfoNext?: (info: DonorInfo) => void;
  businessData?: { businessId: string; isNew: boolean; businessName: string } | null;
  setBusinessData?: (d: { businessId: string; isNew: boolean; businessName: string } | null) => void;
  onBusinessInfoNext?: () => void;
  customFields?: Array<{
    id: string;
    field_name: string;
    field_type: string;
    field_options: any;
    is_required: boolean;
    help_text: string | null;
    display_order: number;
  }>;
  customFieldValues?: Record<string, any>;
  setCustomFieldValues?: (v: Record<string, any>) => void;
  onCustomFieldsNext?: () => void;
  requiresBusinessInfo?: boolean;
  organizationId?: string;
  processingCheckout?: boolean;
  onFinalCheckout?: () => void;
}

const DEFAULT_AMOUNTS = [25, 50, 100, 250, 500, 1000];

export function DonationLanding(props: Props) {
  const {
    campaign,
    attributedRosterMember,
    onProceedToCheckout,
  } = props;

  const checkoutStep = props.checkoutStep || 'cart';
  const setCheckoutStep = props.setCheckoutStep || (() => {});

  const suggestedAmounts =
    Array.isArray(campaign.donation_suggested_amounts) && campaign.donation_suggested_amounts.length > 0
      ? campaign.donation_suggested_amounts.map((n) => Number(n))
      : DEFAULT_AMOUNTS;
  const minAmount = Number(campaign.donation_min_amount ?? 5) || 5;
  const allowRecurring = campaign.donation_allow_recurring !== false;
  const allowDedication = campaign.donation_allow_dedication !== false;
  const allocations = Array.isArray(campaign.donation_allocations) ? campaign.donation_allocations : [];

  // ── donation state ──
  const [selectedChip, setSelectedChip] = useState<number | null>(suggestedAmounts[2] ?? suggestedAmounts[0] ?? 100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [dedicateOn, setDedicateOn] = useState(false);
  const [dedicationType, setDedicationType] = useState<"in_honor_of" | "in_memory_of">("in_honor_of");
  const [dedicationName, setDedicationName] = useState("");

  const amount = useMemo(() => {
    const c = parseFloat(customAmount);
    if (!Number.isNaN(c) && c > 0) return c;
    return selectedChip ?? 0;
  }, [customAmount, selectedChip]);

  const subtotal = amount;
  const platformFee = campaign.fee_model === "org_absorbs" ? 0 : subtotal * 0.10;
  const total = subtotal + platformFee;

  const validAmount = amount >= minAmount;

  const { data: donors = [] } = useCampaignDonors(campaign.id);

  const daysLeft = getDaysLeft(campaign.end_date);
  const raised = Number(campaign.amount_raised || 0);
  const goal = Number(campaign.goal_amount || 0);
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
  const supporterCount = donors.length;
  const avgGift = supporterCount > 0 ? Math.round(raised / supporterCount) : 0;

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

  const handleContinue = () => {
    if (!validAmount) return;
    onProceedToCheckout({
      amount,
      isRecurring,
      dedicationType: dedicateOn ? dedicationType : null,
      dedicationName: dedicateOn && dedicationName.trim() ? dedicationName.trim() : null,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative bg-foreground text-background overflow-hidden">
        {campaign.image_url && (
          <div className="absolute inset-0">
            <img src={campaign.image_url} alt={campaign.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/80" />
          </div>
        )}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary" className="bg-background/15 text-background border-0 hover:bg-background/20">
              {campaign.campaign_type?.name || "Donation"}
            </Badge>
            {daysLeft !== null && (
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 border-0 hover:bg-emerald-500/25">
                {daysLeft} days left
              </Badge>
            )}
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
            <p className="text-lg text-background/85 max-w-2xl">{campaign.description}</p>
          )}

          {goal > 0 && (
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-baseline gap-3">
                <span className="font-serif italic text-3xl md:text-4xl text-primary">
                  ${raised.toLocaleString()}
                </span>
                <span className="text-sm text-background/70">
                  {supporterCount} supporter{supporterCount === 1 ? "" : "s"}
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
            <StatTile label="Raised" value={`$${raised.toLocaleString()}`} />
            <StatTile label="Supporters" value={String(supporterCount)} />
            <StatTile label="Avg gift" value={avgGift ? `$${avgGift}` : "—"} />
            <StatTile
              label="Days left"
              value={daysLeft !== null ? String(daysLeft) : "—"}
              sub={campaign.end_date ? `ends ${new Date(campaign.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : undefined}
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
                    <img src={activePitch.imageUrl} alt={activePitch.name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-primary font-semibold flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" /> You're donating on behalf of
                    </p>
                    <h3 className="text-xl font-bold mt-1">{activePitch.name}</h3>
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
                      <video src={activePitch.recordedVideoUrl} className="w-full h-full object-cover" controls playsInline />
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

          {/* PICK AN AMOUNT */}
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Make a gift</p>
            <h2 className="text-3xl font-bold mb-2">
              Pick an <span className="font-serif italic text-primary">amount.</span>
            </h2>

            <Card>
              <CardContent className="p-5 space-y-5">
                <div className="flex flex-wrap gap-2">
                  {suggestedAmounts.map((amt) => {
                    const active = !customAmount && selectedChip === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => { setSelectedChip(amt); setCustomAmount(""); }}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border"
                        }`}
                      >
                        ${amt.toLocaleString()}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-amt">Or enter a custom amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      id="custom-amt"
                      type="number"
                      min={minAmount}
                      step="1"
                      placeholder="Custom amount"
                      className="pl-7"
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setSelectedChip(null); }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum ${minAmount}.</p>
                </div>

                {(allowRecurring || allowDedication) && <hr />}

                {allowRecurring && (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-sm">Make this a monthly gift</div>
                      <div className="text-xs text-muted-foreground">Charge me every month until the campaign ends.</div>
                    </div>
                    <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                  </div>
                )}

                {allowDedication && (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-sm">Dedicate this gift</div>
                        <div className="text-xs text-muted-foreground">In honor of, or in memory of someone.</div>
                      </div>
                      <Switch checked={dedicateOn} onCheckedChange={setDedicateOn} />
                    </div>
                    {dedicateOn && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Type</Label>
                          <Select value={dedicationType} onValueChange={(v: any) => setDedicationType(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_honor_of">In honor of</SelectItem>
                              <SelectItem value="in_memory_of">In memory of</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Name</Label>
                          <Input
                            placeholder="Their name"
                            value={dedicationName}
                            onChange={(e) => setDedicationName(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* WHERE IT GOES */}
          {allocations.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Where it goes</p>
              <h2 className="text-3xl font-bold mb-6">
                Every <span className="font-serif italic text-primary">dollar,</span> tracked.
              </h2>
              <Card>
                <CardContent className="p-0">
                  {allocations.map((a, i) => (
                    <div
                      key={i}
                      className={`flex items-baseline gap-4 px-6 py-4 ${i > 0 ? "border-t" : ""}`}
                    >
                      <div className="font-serif italic text-2xl text-primary w-16 flex-shrink-0">{a.percent}%</div>
                      <div className="flex-1">
                        <div className="font-semibold">{a.label}</div>
                        {a.description && <div className="text-xs text-muted-foreground mt-0.5">{a.description}</div>}
                      </div>
                      {a.amount != null && (
                        <div className="font-semibold tabular-nums">${Number(a.amount).toLocaleString()}</div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* RECENT SUPPORTERS */}
          {donors.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Recent supporters</p>
              <h2 className="text-3xl font-bold mb-6">
                {donors.length} {donors.length === 1 ? "person" : "people"}{" "}
                <span className="font-serif italic text-primary">chipped in.</span>
              </h2>
              <Card>
                <CardContent className="p-0">
                  {donors.slice(0, 8).map((d, i) => (
                    <div key={d.id} className={`flex items-center gap-3 px-5 py-3 ${i > 0 ? "border-t" : ""}`}>
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs flex-shrink-0">
                        {d.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{d.name}</div>
                        {d.message && <div className="text-xs text-muted-foreground truncate">{d.message}</div>}
                      </div>
                      <div className="font-semibold text-primary tabular-nums">${Math.round(d.amount).toLocaleString()}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* CART SIDEBAR */}
        <aside className="lg:col-span-1">
          <Card className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            <CardContent className="p-5 space-y-4">
              {checkoutStep === 'cart' && (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Heart className="h-4 w-4 text-primary" />
                    Your gift
                  </div>

                  <div className="border-t pt-3 flex justify-between items-start text-sm">
                    <div>
                      <div className="font-medium">{isRecurring ? "Monthly donation" : "One-time donation"}</div>
                      {isRecurring && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <RefreshCw className="h-3 w-3" /> Recurring monthly
                        </div>
                      )}
                      {dedicateOn && dedicationName.trim() && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {dedicationType === "in_memory_of" ? "In memory of" : "In honor of"} {dedicationName}
                        </div>
                      )}
                    </div>
                    <div className="font-semibold">${amount.toFixed(2)}</div>
                  </div>

                  <div className="space-y-1 border-t pt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {campaign.fee_model !== "org_absorbs" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform fee (10%)</span>
                        <span>${platformFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t pt-2">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {campaign.fee_model !== "org_absorbs" && (
                    <Alert className="bg-primary/5 border-primary/20">
                      <AlertDescription className="text-xs">
                        The <strong>10% platform fee</strong> covers card processing and keeps Sponsorly running. By covering it, 100% of your donation reaches the team.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button onClick={handleContinue} size="lg" className="w-full" disabled={!validAmount}>
                    Continue to checkout
                  </Button>
                  {!validAmount && (
                    <p className="text-xs text-muted-foreground text-center">Minimum donation is ${minAmount}.</p>
                  )}
                </>
              )}

              {checkoutStep !== 'cart' && (
                <DonationCheckoutPanel
                  step={checkoutStep}
                  setStep={setCheckoutStep}
                  donorInfo={props.donorInfo || null}
                  onDonorInfoNext={props.onDonorInfoNext}
                  businessData={props.businessData || null}
                  setBusinessData={props.setBusinessData}
                  onBusinessInfoNext={props.onBusinessInfoNext}
                  customFields={props.customFields || []}
                  customFieldValues={props.customFieldValues || {}}
                  setCustomFieldValues={props.setCustomFieldValues}
                  onCustomFieldsNext={props.onCustomFieldsNext}
                  requiresBusinessInfo={!!props.requiresBusinessInfo}
                  organizationId={props.organizationId || ''}
                  processingCheckout={!!props.processingCheckout}
                  onFinalCheckout={props.onFinalCheckout}
                  amount={amount}
                  isRecurring={isRecurring}
                  dedicateOn={dedicateOn}
                  dedicationType={dedicationType}
                  dedicationName={dedicationName}
                  subtotal={subtotal}
                  platformFee={platformFee}
                  total={total}
                  feeModel={campaign.fee_model}
                />
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

// ───────────────────────────── checkout panel ─────────────────────────────

function DonationCheckoutPanel(props: {
  step: CheckoutStep;
  setStep: (s: CheckoutStep) => void;
  donorInfo: DonorInfo | null;
  onDonorInfoNext?: (info: DonorInfo) => void;
  businessData: { businessId: string; isNew: boolean; businessName: string } | null;
  setBusinessData?: (d: { businessId: string; isNew: boolean; businessName: string } | null) => void;
  onBusinessInfoNext?: () => void;
  customFields: Array<any>;
  customFieldValues: Record<string, any>;
  setCustomFieldValues?: (v: Record<string, any>) => void;
  onCustomFieldsNext?: () => void;
  requiresBusinessInfo: boolean;
  organizationId: string;
  processingCheckout: boolean;
  onFinalCheckout?: () => void;
  amount: number;
  isRecurring: boolean;
  dedicateOn: boolean;
  dedicationType: "in_honor_of" | "in_memory_of";
  dedicationName: string;
  subtotal: number;
  platformFee: number;
  total: number;
  feeModel: "donor_covers" | "org_absorbs" | null;
}) {
  const {
    step, setStep, donorInfo, onDonorInfoNext, onBusinessInfoNext,
    customFields, customFieldValues, setCustomFieldValues, onCustomFieldsNext,
    requiresBusinessInfo, organizationId, processingCheckout, onFinalCheckout,
    amount, isRecurring, dedicateOn, dedicationType, dedicationName,
    subtotal, platformFee, total, feeModel,
  } = props;

  const stepLabels: Record<CheckoutStep, string> = {
    'cart': 'Cart',
    'donor-info': 'Your info',
    'business-info': 'Business info',
    'custom-fields': 'Details',
    'payment': 'Review & pay',
  };

  const [donorLoginOpen, setDonorLoginOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{stepLabels[step]}</div>
        {step === 'donor-info' && (
          <button
            type="button"
            onClick={() => setDonorLoginOpen((v) => !v)}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <span>Have an account?</span>
            <LogIn className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">{donorLoginOpen ? "Hide" : "Log in"}</span>
          </button>
        )}
      </div>

      {step === 'donor-info' && (
        <DonorInfoForm
          organizationId={organizationId}
          onBack={() => setStep('cart')}
          onComplete={(info) => onDonorInfoNext?.(info)}
          hideLoginTrigger
          loginOpen={donorLoginOpen}
          onLoginOpenChange={setDonorLoginOpen}
        />
      )}

      {step === 'business-info' && (
        <div className="space-y-4">
          <BusinessInfoForm
            organizationId={organizationId}
            onBusinessSelected={(businessId, isNew, businessName) => {
              props.setBusinessData?.({ businessId, isNew, businessName });
              onBusinessInfoNext?.();
            }}
            onSkip={requiresBusinessInfo ? undefined : () => onBusinessInfoNext?.()}
          />
          <Button variant="outline" className="w-full" onClick={() => setStep('donor-info')}>
            Back
          </Button>
        </div>
      )}

      {step === 'custom-fields' && (
        <div className="space-y-4">
          <CustomFieldsRenderer
            fields={customFields as any}
            values={customFieldValues}
            onChange={(fieldId, value) => {
              setCustomFieldValues?.({ ...customFieldValues, [fieldId]: value });
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(requiresBusinessInfo ? 'business-info' : 'donor-info')}
            >
              Back
            </Button>
            <Button className="flex-1" onClick={() => onCustomFieldsNext?.()}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-4">
          <div className="space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isRecurring ? "Monthly donation" : "One-time donation"}
              </span>
              <span>${amount.toFixed(2)}</span>
            </div>
            {dedicateOn && dedicationName.trim() && (
              <div className="text-xs text-muted-foreground">
                {dedicationType === "in_memory_of" ? "In memory of" : "In honor of"} {dedicationName}
              </div>
            )}
          </div>
          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {feeModel !== 'org_absorbs' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee (10%)</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          {feeModel !== 'org_absorbs' && (
            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription className="text-xs">
                The <strong>10% platform fee</strong> covers card processing and keeps Sponsorly running. By covering it, 100% of your donation reaches the team.
              </AlertDescription>
            </Alert>
          )}
          {donorInfo && (
            <div className="rounded-md border p-3 text-xs space-y-0.5">
              <div className="font-medium text-sm">{donorInfo.firstName} {donorInfo.lastName}</div>
              <div className="text-muted-foreground">{donorInfo.email}</div>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={processingCheckout}
              onClick={() => {
                if (customFields.length > 0) setStep('custom-fields');
                else if (requiresBusinessInfo) setStep('business-info');
                else setStep('donor-info');
              }}
            >
              Back
            </Button>
            <Button className="flex-1" disabled={processingCheckout} onClick={() => onFinalCheckout?.()}>
              {processingCheckout && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Pay ${total.toFixed(2)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}