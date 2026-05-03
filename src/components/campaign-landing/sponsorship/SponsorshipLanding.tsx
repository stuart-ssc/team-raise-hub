import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MapPin,
  Target,
  Calendar,
  Minus,
  Plus,
  Check,
  Info,
  RefreshCw,
  Trophy,
  ShoppingCart,
  Upload,
  X,
  Loader2,
  LogIn,
} from "lucide-react";
import { useCampaignSponsors } from "@/hooks/useCampaignSponsors";
import { DonorInfoForm, DonorInfo } from "@/components/DonorInfoForm";
import { BusinessInfoForm } from "@/components/BusinessInfoForm";
import { CustomFieldsRenderer } from "@/components/CustomFieldsRenderer";

// ───────────────────────────── types ─────────────────────────────

interface ItemVariant {
  id: string;
  size: string;
  quantity_available: number;
}

export interface SponsorshipItem {
  id: string;
  name: string;
  description: string | null;
  cost: number | null;
  quantity_offered: number | null;
  quantity_available: number | null;
  max_items_purchased: number | null;
  is_recurring: boolean | null;
  recurring_interval: string | null;
  has_variants: boolean | null;
  is_most_popular?: boolean | null;
  feature_bullets?: string[] | null;
  selectedQuantity: number;
  selectedVariants?: { [variantId: string]: number };
  variants?: ItemVariant[];
}

export interface SponsorshipCampaign {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  amount_raised: number | null;
  end_date: string | null;
  image_url: string | null;
  hero_accent_word?: string | null;
  fee_model: "donor_covers" | "org_absorbs" | null;
  groups: {
    organization_id: string;
    group_name: string;
    schools: { school_name: string };
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

interface SponsorshipLandingProps {
  campaign: SponsorshipCampaign;
  cart: SponsorshipItem[];
  attributedRosterMember: AttributedRosterMember | null;
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onUpdateVariantQuantity: (itemId: string, variantId: string, qty: number) => void;
  onProceedToCheckout: () => void;
  subtotal: number;
  platformFee: number;
  total: number;
  selectedItemsCount: number;
  // Inline checkout
  checkoutStep?: 'cart' | 'donor-info' | 'business-info' | 'custom-fields' | 'payment';
  setCheckoutStep?: (s: 'cart' | 'donor-info' | 'business-info' | 'custom-fields' | 'payment') => void;
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
  pendingLogoFile?: File | null;
  setPendingLogoFile?: (f: File | null) => void;
}

// ───────────────────────────── helpers ─────────────────────────────

function getDaysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function formatHeadline(title: string, accent: string | null | undefined) {
  if (!accent) return <>{title}</>;
  const idx = title.toLowerCase().indexOf(accent.toLowerCase());
  if (idx < 0) return <>{title}</>;
  const before = title.slice(0, idx);
  const match = title.slice(idx, idx + accent.length);
  const after = title.slice(idx + accent.length);
  return (
    <>
      {before}
      <span className="font-serif italic text-primary">{match}</span>
      {after}
    </>
  );
}

function getVideoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

// ───────────────────────────── component ─────────────────────────────

export function SponsorshipLanding(props: SponsorshipLandingProps) {
  const {
    campaign,
    cart,
    attributedRosterMember,
    onUpdateQuantity,
    onUpdateVariantQuantity,
    onProceedToCheckout,
    subtotal,
    platformFee,
    total,
    selectedItemsCount,
  } = props;

  const { data: sponsors = [] } = useCampaignSponsors(campaign.id);
  const checkoutStep = props.checkoutStep || 'cart';
  const setCheckoutStep = props.setCheckoutStep || (() => {});

  const daysLeft = getDaysLeft(campaign.end_date);
  const raised = campaign.amount_raised || 0;
  const goal = campaign.goal_amount || 0;
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
  const sponsorCount = sponsors.length;
  const avgSponsorship = sponsorCount > 0 ? Math.round(raised / sponsorCount) : 0;

  // pitch (roster member overrides campaign)
  const activePitch = useMemo(() => {
    if (
      attributedRosterMember &&
      (attributedRosterMember.pitchMessage ||
        attributedRosterMember.pitchImageUrl ||
        attributedRosterMember.pitchVideoUrl ||
        attributedRosterMember.pitchRecordedVideoUrl)
    ) {
      return {
        type: "roster" as const,
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
  const recurringInCart = cart.some((i) => i.selectedQuantity > 0 && i.is_recurring);

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
            <Badge variant="secondary" className="bg-background/15 text-background border-0 hover:bg-background/20">
              {campaign.campaign_type?.name || "Sponsorship"}
            </Badge>
            {daysLeft !== null && (
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 border-0 hover:bg-emerald-500/25">
                {daysLeft} days left
              </Badge>
            )}
            {campaign.groups && (
              <span className="flex items-center gap-1 text-background/80">
                <MapPin className="h-4 w-4" />
                {campaign.groups.group_name} • {campaign.groups.schools.school_name}
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
                  {sponsorCount} sponsor{sponsorCount === 1 ? "" : "s"}
                </span>
              </div>
              <Progress value={progress} className="h-2 bg-background/15" />
              <div className="flex justify-between text-xs text-background/70">
                <span>{progress.toFixed(0)}% of goal</span>
                <span>Goal ${goal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Stat tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <StatTile label="Raised" value={`$${raised.toLocaleString()}`} />
            <StatTile label="Sponsors" value={String(sponsorCount)} />
            <StatTile label="Avg sponsorship" value={avgSponsorship ? `$${avgSponsorship}` : "—"} />
            <StatTile
              label="Days left"
              value={daysLeft !== null ? String(daysLeft) : "—"}
              sub={campaign.end_date ? `ends ${new Date(campaign.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : undefined}
            />
          </div>
        </div>
      </section>

      {/* MAIN: pitch + items (left) | cart (right) */}
      <section className="max-w-6xl mx-auto px-6 py-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          {/* Pitch card (roster) */}
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
                      <Trophy className="h-3.5 w-3.5" /> You're sponsoring
                    </p>
                    <h3 className="text-xl font-bold mt-1">{activePitch.name}</h3>
                    {campaign.groups && (
                      <p className="text-sm text-muted-foreground">
                        {campaign.groups.group_name} • {campaign.groups.schools.school_name}
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

          {/* Items grid */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Sponsorship opportunities</h2>

            {cart.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No sponsorship items available yet.
                </CardContent>
              </Card>
            ) : (
              <div className={`grid grid-cols-1 gap-4 ${cart.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                {cart.map((item, idx) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={idx}
                    onUpdateQuantity={onUpdateQuantity}
                    onUpdateVariantQuantity={onUpdateVariantQuantity}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CART SIDEBAR */}
        <aside className="lg:col-span-1">
          <Card className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            <CardContent className="p-5 space-y-4">
              {checkoutStep === 'cart' && (
              <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Your sponsorship
                </div>
                <span className="text-xs text-muted-foreground">
                  {selectedItemsCount} item{selectedItemsCount === 1 ? "" : "s"}
                </span>
              </div>

              {selectedItemsCount === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Select an item to start your sponsorship.
                </p>
              ) : (
                <>
                  <div className="space-y-2 border-t pt-3">
                    {cart
                      .filter((i) => i.selectedQuantity > 0)
                      .map((i) => (
                        <div key={i.id} className="flex justify-between text-sm">
                          <div>
                            <div className="font-medium">{i.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {i.selectedQuantity} × ${(i.cost || 0).toFixed(0)}
                            </div>
                          </div>
                          <div className="font-semibold">
                            ${((i.cost || 0) * i.selectedQuantity).toFixed(0)}
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="space-y-1 border-t pt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {campaign.fee_model !== "org_absorbs" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          Platform fee (10%)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Covers card processing and keeps Sponsorly running so 100% of your sponsorship reaches the team.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <span>${platformFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t pt-2">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {recurringInCart && (
                    <Alert>
                      <RefreshCw className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Recurring sponsorship — you'll be charged on a schedule until you cancel.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert className="bg-primary/5 border-primary/20">
                    <AlertDescription className="text-xs">
                      The <strong>10% platform fee</strong> covers card processing and keeps Sponsorly running. By covering it, 100% of your sponsorship reaches the team.
                    </AlertDescription>
                  </Alert>

                  <Button onClick={onProceedToCheckout} size="lg" className="w-full">
                    Continue to checkout
                  </Button>
                </>
              )}
              </>
              )}

              {checkoutStep !== 'cart' && (
                <CheckoutStepsPanel
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
                  pendingLogoFile={props.pendingLogoFile || null}
                  setPendingLogoFile={props.setPendingLogoFile}
                  cart={cart}
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

      {/* SPONSOR WALL */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
          The sponsor wall
        </p>
        <h2 className="text-3xl font-bold mb-2">
          Already <span className="font-serif italic text-primary">on the wall.</span>
        </h2>
        <p className="text-muted-foreground mb-6">
          {sponsorCount > 0
            ? `${sponsorCount} local business${sponsorCount === 1 ? "" : "es"} ${sponsorCount === 1 ? "has" : "have"} committed so far. Your logo joins this group.`
            : "Be the first business on the wall."}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="aspect-[3/2] rounded-lg border bg-muted/30 flex items-center justify-center p-3"
            >
              {s.displayLogo ? (
                <img
                  src={s.displayLogo}
                  alt={s.businessName}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="font-serif italic text-center text-foreground/70 text-sm">
                  {s.businessName}
                </span>
              )}
            </div>
          ))}
          <div className="aspect-[3/2] rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/10">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Your logo here
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ───────────────────────────── sub-components ─────────────────────────────

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-background/15 bg-background/5 backdrop-blur p-4">
      <div className="text-[10px] uppercase tracking-widest text-background/60">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-background/60 mt-0.5">{sub}</div>}
    </div>
  );
}

function ItemCard({
  item,
  index,
  onUpdateQuantity,
  onUpdateVariantQuantity,
}: {
  item: SponsorshipItem;
  index: number;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateVariantQuantity: (id: string, vId: string, qty: number) => void;
}) {
  const isPopular = !!item.is_most_popular;
  const offered = item.quantity_offered ?? null;
  const available = item.quantity_available ?? null;
  const bullets = Array.isArray(item.feature_bullets) ? item.feature_bullets : [];

  return (
    <Card
      className={`relative flex flex-col ${
        isPopular ? "border-primary border-2 shadow-lg" : ""
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most popular</Badge>
        </div>
      )}
      <CardContent className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        )}

        <div className="mt-4">
          <div className="font-serif italic text-3xl text-primary">
            ${(item.cost || 0).toFixed(0)}
          </div>
          {available !== null && offered !== null && (
            <div className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{available}</span> of {offered} left
            </div>
          )}
          {item.is_recurring && (
            <Badge variant="secondary" className="mt-2 flex items-center gap-1 w-fit">
              <RefreshCw className="h-3 w-3" />
              {item.recurring_interval === "month" ? "Monthly" : "Annual"}
            </Badge>
          )}
        </div>

        {bullets.length > 0 && (
          <ul className="mt-4 space-y-2 flex-1">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Variant pickers */}
        {item.has_variants && item.variants && item.variants.length > 0 ? (
          <div className="mt-4 space-y-2">
            {item.variants.map((v) => {
              const qty = item.selectedVariants?.[v.id] || 0;
              const canAdd = v.quantity_available > 0 && qty < v.quantity_available;
              return (
                <div key={v.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    <Badge variant="outline">{v.size}</Badge>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {v.quantity_available} left
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onUpdateVariantQuantity(item.id, v.id, qty - 1)}
                      disabled={qty === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{qty}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onUpdateVariantQuantity(item.id, v.id, qty + 1)}
                      disabled={!canAdd}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 pt-4 border-t flex flex-col items-center gap-3">
            <Button
              variant={item.selectedQuantity > 0 ? "default" : "outline"}
              size="sm"
              className="rounded-full w-full"
              onClick={() =>
                onUpdateQuantity(item.id, item.selectedQuantity > 0 ? item.selectedQuantity : 1)
              }
              disabled={available !== null && available <= 0 && item.selectedQuantity === 0}
            >
              {item.selectedQuantity > 0 ? `Choose ${item.name}` : `Choose ${item.name}`}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => onUpdateQuantity(item.id, item.selectedQuantity - 1)}
                disabled={item.selectedQuantity === 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center font-medium">{item.selectedQuantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => onUpdateQuantity(item.id, item.selectedQuantity + 1)}
                disabled={
                  (available !== null && item.selectedQuantity >= available) ||
                  (item.max_items_purchased !== null &&
                    item.max_items_purchased !== undefined &&
                    item.selectedQuantity >= item.max_items_purchased)
                }
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ───────────────────────────── checkout panel ─────────────────────────────

type CheckoutStep = 'cart' | 'donor-info' | 'business-info' | 'custom-fields' | 'payment';

function CheckoutStepsPanel(props: {
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
  pendingLogoFile: File | null;
  setPendingLogoFile?: (f: File | null) => void;
  cart: SponsorshipItem[];
  subtotal: number;
  platformFee: number;
  total: number;
  feeModel: "donor_covers" | "org_absorbs" | null;
}) {
  const {
    step, setStep, donorInfo, onDonorInfoNext, businessData, onBusinessInfoNext,
    customFields, customFieldValues, setCustomFieldValues, onCustomFieldsNext,
    requiresBusinessInfo, organizationId, processingCheckout, onFinalCheckout,
    pendingLogoFile, setPendingLogoFile, cart, subtotal, platformFee, total, feeModel,
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
          <LogoUploadInline
            file={pendingLogoFile}
            onChange={(f) => setPendingLogoFile?.(f)}
          />
          <BusinessInfoForm
            organizationId={organizationId}
            logoFile={pendingLogoFile}
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
            {cart.filter(i => i.selectedQuantity > 0).map(i => (
              <div key={i.id} className="flex justify-between">
                <span className="text-muted-foreground">{i.name} × {i.selectedQuantity}</span>
                <span>${((i.cost || 0) * i.selectedQuantity).toFixed(2)}</span>
              </div>
            ))}
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
                The <strong>10% platform fee</strong> covers card processing and keeps Sponsorly running. By covering it, 100% of your sponsorship reaches the team.
              </AlertDescription>
            </Alert>
          )}
          {donorInfo && (
            <div className="rounded-md border p-3 text-xs space-y-0.5">
              <div className="font-medium text-sm">{donorInfo.firstName} {donorInfo.lastName}</div>
              <div className="text-muted-foreground">{donorInfo.email}</div>
              {businessData && (
                <div className="text-muted-foreground mt-1">Business: {businessData.businessName}</div>
              )}
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

function LogoUploadInline({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    onChange(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="text-sm font-medium">Business logo (optional)</div>
      {file && preview ? (
        <div className="flex items-center gap-3">
          <img src={preview} alt="Logo preview" className="h-12 w-12 object-contain border rounded" />
          <div className="text-xs text-muted-foreground flex-1 truncate">{file.name}</div>
          <Button variant="ghost" size="sm" onClick={() => handleFile(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" /> Upload PNG / SVG
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
      <p className="text-xs text-muted-foreground">
        We'll attach this to your business account for sponsorship recognition.
      </p>
    </div>
  );
}