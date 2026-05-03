import {
  ShoppingCart,
  Minus,
  Plus,
  MapPin,
  Star,
  Check,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SponsorshipLanding,
  SponsorshipLandingProps,
  SponsorshipItem,
} from "@/components/campaign-landing/sponsorship/SponsorshipLanding";
import {
  formatHeadline,
  getVideoEmbedUrl,
} from "@/components/campaign-landing/shared/landingHelpers";

export interface MerchandiseCampaignFields {
  merch_ships_by_date?: string | null;
  merch_pickup_available?: boolean | null;
  merch_pickup_note?: string | null;
  merch_shipping_flat_rate?: number | null;
}

type MerchandiseLandingProps = SponsorshipLandingProps & {
  merchFields: MerchandiseCampaignFields;
};

const accent = "text-[hsl(var(--merch-accent))]";
const accentBg = "bg-[hsl(var(--merch-accent))]";

function getDaysLeft(end: string | null | undefined) {
  if (!end) return null;
  const d = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  return d > 0 ? d : 0;
}

function formatShortDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${accent} mb-3`}>
      {children}
    </p>
  );
}

function QtyStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number | null;
}) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(max != null ? Math.min(max, value + 1) : value + 1);
  return (
    <div className="inline-flex items-center justify-between gap-2 rounded-full border border-border bg-background px-2 py-1 w-full">
      <button
        type="button"
        onClick={dec}
        disabled={value <= 0}
        className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
        aria-label="Decrease"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="font-semibold text-sm w-5 text-center">{value}</span>
      <button
        type="button"
        onClick={inc}
        className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label="Increase"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MerchItemCard({
  item,
  onUpdateQuantity,
  onUpdateVariantQuantity,
}: {
  item: SponsorshipItem & { image?: string | null };
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateVariantQuantity: (itemId: string, variantId: string, qty: number) => void;
}) {
  const offered = item.quantity_offered ?? 0;
  const available = item.quantity_available ?? 0;
  const unlimited = !offered;
  const lowStock = !unlimited && offered > 0 && available / offered < 0.15 && available > 0;
  const soldOut = !unlimited && available <= 0;
  const remainingLabel = unlimited
    ? "Unlimited"
    : `${available} left`;

  const hasVariants = !!(item.has_variants && item.variants && item.variants.length > 0);

  const totalSelectedAcrossVariants = hasVariants
    ? Object.values(item.selectedVariants || {}).reduce((s, q) => s + (q || 0), 0)
    : 0;

  const nonVariantStepperMax = unlimited
    ? item.max_items_purchased ?? null
    : Math.min(available, item.max_items_purchased ?? available);

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-muted">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, hsl(var(--muted)) 0 10px, transparent 10px 20px)",
            }}
          >
            Product photo
          </div>
        )}
        {lowStock && (
          <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-destructive text-destructive-foreground">
            Almost gone
          </span>
        )}
        {soldOut && (
          <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-foreground text-background">
            Sold out
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-serif text-lg leading-tight">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
          )}
        </div>

        <div className="flex items-baseline justify-between">
          <span className={`font-serif italic text-xl ${accent}`}>
            ${(item.cost || 0).toFixed(0)}
          </span>
          <span className="text-[11px] text-muted-foreground">{remainingLabel}</span>
        </div>

        {hasVariants ? (
          <div>
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              <span>Size</span>
              <span>Quantity</span>
            </div>
            <div className="space-y-1.5">
              {item.variants!.map((v) => {
                const qty = item.selectedVariants?.[v.id] || 0;
                const variantSoldOut = v.quantity_available <= 0 && qty <= 0;
                const max = item.max_items_purchased
                  ? Math.min(v.quantity_available, item.max_items_purchased)
                  : v.quantity_available;
                return (
                  <div
                    key={v.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-tight">{v.size}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {variantSoldOut
                          ? "Sold out"
                          : `${v.quantity_available} left`}
                      </div>
                    </div>
                    <div className="w-[110px]">
                      {variantSoldOut ? (
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground text-right pr-2">
                          —
                        </div>
                      ) : (
                        <QtyStepper
                          value={qty}
                          onChange={(n) => onUpdateVariantQuantity(item.id, v.id, n)}
                          max={max}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Quantity
            </div>
            <QtyStepper
              value={item.selectedQuantity}
              onChange={(n) => onUpdateQuantity(item.id, n)}
              max={nonVariantStepperMax}
            />
          </div>
        )}

        <div className="text-[11px] text-muted-foreground mt-auto">
          {hasVariants && totalSelectedAcrossVariants > 0 && (
            <div>{totalSelectedAcrossVariants} selected</div>
          )}
          {item.max_items_purchased ? (
            <div>Max {item.max_items_purchased} per person</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RosterPitchCard({
  member,
}: {
  member: NonNullable<SponsorshipLandingProps["attributedRosterMember"]>;
}) {
  const embedUrl = getVideoEmbedUrl(member.pitchVideoUrl);
  const recorded = member.pitchRecordedVideoUrl;
  return (
    <div className="rounded-xl bg-card border border-border/60 border-l-[3px] border-l-[hsl(var(--merch-accent))] overflow-hidden">
      <div className="p-5 flex items-start gap-4">
        {member.pitchImageUrl ? (
          <img
            src={member.pitchImageUrl}
            alt={`${member.firstName} ${member.lastName}`}
            className="h-14 w-14 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-muted shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${accent} mb-1`}>
            <Star className="h-3 w-3 fill-current" />
            You're shopping through
          </div>
          <div className="font-serif text-xl">
            {member.firstName} {member.lastName}
          </div>
          {member.pitchMessage && (
            <p className="font-serif italic text-sm text-muted-foreground mt-2 leading-relaxed">
              "{member.pitchMessage}"
            </p>
          )}
        </div>
      </div>
      {(embedUrl || recorded) && (
        <div className="px-5 pb-5">
          <div className="rounded-lg overflow-hidden bg-black aspect-video">
            {recorded ? (
              <video src={recorded} controls className="w-full h-full object-cover" />
            ) : embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function CartSidebar({
  cart,
  selectedItemsCount,
  subtotal,
  total,
  onProceedToCheckout,
  merchFields,
}: Pick<
  MerchandiseLandingProps,
  "cart" | "selectedItemsCount" | "subtotal" | "total" | "onProceedToCheckout" | "merchFields"
>) {
  const selected = cart.filter((i) => {
    if (i.selectedQuantity > 0) return true;
    if (i.selectedVariants) {
      return Object.values(i.selectedVariants).some((q) => q > 0);
    }
    return false;
  });

  // Build flat line items (per-variant when applicable)
  const lines = selected.flatMap((i) => {
    const variantLines = i.selectedVariants
      ? Object.entries(i.selectedVariants)
          .filter(([, q]) => q > 0)
          .map(([vid, q]) => {
            const v = i.variants?.find((x) => x.id === vid);
            return {
              key: `${i.id}-${vid}`,
              name: i.name,
              detail: v ? `Size ${v.size} · ${q} × $${(i.cost || 0).toFixed(0)}` : `${q} × $${(i.cost || 0).toFixed(0)}`,
              total: (i.cost || 0) * q,
            };
          })
      : [];
    if (variantLines.length > 0) return variantLines;
    if (i.selectedQuantity > 0) {
      return [
        {
          key: i.id,
          name: i.name,
          detail: `${i.selectedQuantity} × $${(i.cost || 0).toFixed(0)}`,
          total: (i.cost || 0) * i.selectedQuantity,
        },
      ];
    }
    return [];
  });

  const shipping = merchFields.merch_shipping_flat_rate || 0;
  const platformFee = total - subtotal;
  const grandTotal = total + shipping;
  const shipsBy = formatShortDate(merchFields.merch_ships_by_date);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded ${accentBg}/10 ${accent} flex items-center justify-center`}>
            <ShoppingCart className="h-4 w-4" />
          </div>
          <span className="font-semibold">Your order</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {selectedItemsCount} item{selectedItemsCount === 1 ? "" : "s"}
        </span>
      </div>

      {lines.length === 0 ? (
        <div className="text-center py-6">
          <div className="font-medium mb-1">Cart is empty</div>
          <p className="text-xs text-muted-foreground">
            Choose a size and quantity to add merch to your order.
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {lines.map((l) => (
            <div key={l.key} className="flex items-start justify-between gap-2 text-sm">
              <div className="min-w-0">
                <div className="font-medium truncate">{l.name}</div>
                <div className="text-[11px] text-muted-foreground">{l.detail}</div>
              </div>
              <span className="font-medium whitespace-nowrap">${l.total.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border/60 pt-3 mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {shipping > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
            )}
            {platformFee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Platform fee (10%)</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold pt-2 border-t border-border/60">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {platformFee > 0 && (
        <div className={`text-[11px] text-muted-foreground rounded-md ${accentBg}/10 px-3 py-2 mb-3 leading-snug`}>
          The <span className="font-semibold">10% platform fee</span> covers card processing
          and keeps Sponsorly running. By covering it,{" "}
          <span className="font-semibold">100% of your purchase</span> reaches the team.
        </div>
      )}

      <Button
        size="lg"
        disabled={selectedItemsCount === 0}
        onClick={onProceedToCheckout}
        className={`w-full ${accentBg} text-white hover:opacity-90`}
      >
        Continue to checkout
      </Button>

      {(shipsBy || merchFields.merch_pickup_available) && (
        <p className="text-[11px] text-muted-foreground mt-3 flex items-start gap-1.5">
          <Check className={`h-3 w-3 ${accent} mt-0.5 shrink-0`} />
          <span>
            {shipsBy && <>Ships by {shipsBy}.{" "}</>}
            {merchFields.merch_pickup_available && <>Pickup option at next checkout step.</>}
          </span>
        </p>
      )}
    </div>
  );
}

export function MerchandiseLanding(props: MerchandiseLandingProps) {
  const {
    merchFields,
    campaign,
    cart,
    attributedRosterMember,
    onUpdateQuantity,
    onUpdateVariantQuantity,
    onProceedToCheckout,
    subtotal,
    total,
    selectedItemsCount,
    checkoutStep,
  } = props;

  // Defer to SponsorshipLanding for the donor-info → payment steps so that
  // all existing checkout flow (donor info, business info, custom fields) works.
  if (checkoutStep && checkoutStep !== "cart") {
    return <SponsorshipLanding {...props} />;
  }

  const goal = campaign.goal_amount || 0;
  const raised = campaign.amount_raised || 0;
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  // Items left across items + variants
  const itemsLeft = cart.reduce((sum, i: any) => {
    if (i.has_variants && i.variants?.length) {
      return sum + i.variants.reduce((s: number, v: any) => s + (v.quantity_available || 0), 0);
    }
    return sum + (i.quantity_available || 0);
  }, 0);

  // Order count from amount raised (no direct count here); fall back to deriving from goal/avg
  const orderCount = (campaign as any).order_count ?? null;

  const closesShort = formatShortDate(campaign.end_date);
  const daysLeft = getDaysLeft(campaign.end_date);

  const hasRosterPitch =
    attributedRosterMember &&
    (attributedRosterMember.pitchMessage ||
      attributedRosterMember.pitchImageUrl ||
      attributedRosterMember.pitchVideoUrl ||
      attributedRosterMember.pitchRecordedVideoUrl);

  const orgLabel = campaign.groups
    ? `${campaign.groups.schools?.school_name || ""} · ${campaign.groups.group_name || ""}`
        .replace(/^\s*·\s*/, "")
        .replace(/\s*·\s*$/, "")
    : "";

  return (
    <div className="min-h-screen bg-[hsl(var(--merch-bg))]">
      {/* HERO — dark photo background, full bleed */}
      <section className="relative text-white overflow-hidden">
        {campaign.image_url ? (
          <div className="absolute inset-0">
            <img
              src={campaign.image_url}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}

        <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-8">
          {/* status pills */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {campaign.campaign_type?.name || "Merchandise"}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 ${accent}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${accentBg}`} />
              {daysLeft != null && daysLeft <= 0 ? "Shop closed" : "Shop open"}
            </span>
            {orgLabel && (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/80">
                <MapPin className="h-3 w-3" />
                {orgLabel}
              </span>
            )}
          </div>

          <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-[1.05] mb-4 max-w-3xl">
            {formatHeadline(campaign.name, campaign.hero_accent_word)}
          </h1>

          {campaign.description && (
            <p className="text-base text-white/85 max-w-2xl mb-6">{campaign.description}</p>
          )}

          {goal > 0 && (
            <div className="max-w-xl mb-8">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className={`font-serif italic text-3xl ${accent}`}>
                  ${raised.toLocaleString()}
                </span>
                <span className="text-xs text-white/70">Goal: ${goal.toLocaleString()}</span>
              </div>
              <div className="relative h-1 rounded-full bg-white/15 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${accentBg} rounded-full`}
                  style={{ width: `${progress}%` }}
                />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full ${accentBg} ring-2 ring-white/30`}
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>
            </div>
          )}

          {/* STAT TILES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-white/15 bg-black/30 backdrop-blur p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/60">Raised</div>
              <div className="font-serif text-2xl mt-1">${raised.toLocaleString()}</div>
            </div>
            {orderCount != null && (
              <div className="rounded-lg border border-white/15 bg-black/30 backdrop-blur p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/60">Orders</div>
                <div className="font-serif text-2xl mt-1">{orderCount}</div>
              </div>
            )}
            <div className="rounded-lg border border-white/15 bg-black/30 backdrop-blur p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/60">Items Left</div>
              <div className="font-serif text-2xl mt-1">{itemsLeft}</div>
              <div className="text-xs text-white/60 mt-0.5">across all sizes</div>
            </div>
            {closesShort && (
              <div className="rounded-lg border border-white/15 bg-black/30 backdrop-blur p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/60">Closes</div>
                <div className="font-serif text-2xl mt-1">{closesShort}</div>
                {daysLeft != null && (
                  <div className="text-xs text-white/60 mt-0.5">
                    {daysLeft > 0 ? `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}` : "closed"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TWO-COLUMN BODY */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {hasRosterPitch && attributedRosterMember && (
            <RosterPitchCard member={attributedRosterMember} />
          )}

          <section>
            <Eyebrow>Available items</Eyebrow>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-2">
              {formatHeadline("Pick your size.", "size")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xl">
              Each item maxes out at the per-person limit shown — kindly leave some for everyone.
            </p>

            {cart.length === 0 ? (
              <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
                No items available yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cart.map((item) => (
                  <MerchItemCard
                    key={item.id}
                    item={item as any}
                    onUpdateQuantity={onUpdateQuantity}
                    onUpdateVariantQuantity={onUpdateVariantQuantity}
                  />
                ))}
              </div>
            )}
          </section>

          {merchFields.merch_pickup_note && (
            <section className="rounded-xl border border-border/60 bg-card p-5">
              <div className="flex items-start gap-3">
                <Truck className={`h-5 w-5 ${accent} mt-0.5 shrink-0`} />
                <div>
                  <div className="font-semibold mb-1">Pickup details</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {merchFields.merch_pickup_note}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6">
            <CartSidebar
              cart={cart}
              selectedItemsCount={selectedItemsCount}
              subtotal={subtotal}
              total={total}
              onProceedToCheckout={onProceedToCheckout}
              merchFields={merchFields}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}