import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  MapPin,
  Trophy,
  ListChecks,
  Minus,
  Plus,
  Check,
  Star,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  SponsorshipLanding,
  SponsorshipLandingProps,
  SponsorshipItem,
} from "@/components/campaign-landing/sponsorship/SponsorshipLanding";
import { formatHeadline, getVideoEmbedUrl } from "@/components/campaign-landing/shared/landingHelpers";
import {
  BrandedLandingWrapper,
  BrandLogoStrip,
} from "@/components/campaign-landing/shared/BrandedLandingWrapper";

export interface EventCampaignFields {
  event_start_at?: string | null;
  event_location_name?: string | null;
  event_location_address?: string | null;
  event_format?: string | null;
  event_format_subtitle?: string | null;
  event_includes?: string[] | null;
  event_includes_subtitle?: string | null;
  event_agenda?: Array<{ time?: string; title?: string; description?: string }> | null;
  event_details_heading?: string | null;
  event_details_heading_accent?: string | null;
  event_agenda_heading?: string | null;
  event_agenda_heading_accent?: string | null;
  event_includes_heading?: string | null;
}

type EventLandingProps = SponsorshipLandingProps & {
  eventFields: EventCampaignFields;
};

function getDaysLeft(end: string | null | undefined) {
  if (!end) return null;
  const d = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  return d > 0 ? d : 0;
}

const accent = "text-[hsl(var(--event-accent))]";
const accentBg = "bg-[hsl(var(--event-accent))]";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${accent} mb-3`}>
      {children}
    </p>
  );
}

function SectionHeading({ text, accent }: { text: string; accent?: string | null }) {
  return (
    <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6">
      {formatHeadline(text, accent || undefined)}
    </h2>
  );
}

function DetailTile({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: React.ReactNode;
  subtitle?: string | null;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 flex items-start gap-3">
      <div className={`h-9 w-9 rounded-lg bg-[hsl(var(--event-accent))]/10 ${accent} flex items-center justify-center shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        {value && <div className="font-semibold text-base mt-0.5 leading-tight">{value}</div>}
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      </div>
    </div>
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
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1">
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

function TicketCard({
  item,
  onUpdate,
}: {
  item: SponsorshipItem;
  onUpdate: (id: string, qty: number) => void;
}) {
  const offered = item.quantity_offered ?? 0;
  const available = item.quantity_available ?? 0;
  const unlimited = !offered;
  const remainingLabel = unlimited
    ? "Unlimited"
    : `${available} of ${offered} left`;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-xl font-medium tracking-tight">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          )}
          {item.feature_bullets && item.feature_bullets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              {item.feature_bullets.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className={`h-3 w-3 ${accent}`} />
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right min-w-[110px] flex flex-col items-end gap-2">
          <div>
            <div className={`font-serif italic text-2xl ${accent} leading-none`}>
              ${(item.cost || 0).toFixed(0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">{remainingLabel}</div>
          </div>
          <QtyStepper
            value={item.selectedQuantity}
            onChange={(n) => onUpdate(item.id, n)}
            max={
              unlimited
                ? item.max_items_purchased ?? null
                : Math.min(available, item.max_items_purchased ?? available)
            }
          />
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
    <div className="rounded-xl bg-card border border-border/60 border-l-[3px] border-l-[hsl(var(--event-accent))] overflow-hidden">
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
            You're buying tickets through
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
}: Pick<
  EventLandingProps,
  "cart" | "selectedItemsCount" | "subtotal" | "total" | "onProceedToCheckout"
>) {
  const selected = cart.filter((i) => i.selectedQuantity > 0);
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`h-6 w-6 rounded ${accentBg} flex items-center justify-center`}>
            <Ticket className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold">Your tickets</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {selectedItemsCount} item{selectedItemsCount === 1 ? "" : "s"}
        </span>
      </div>

      {selected.length === 0 ? (
        <div className="text-center py-6">
          <div className="font-medium mb-1">No tickets yet</div>
          <p className="text-xs text-muted-foreground">
            Add a foursome, single, or hole sponsorship to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {selected.map((i) => (
            <div key={i.id} className="flex items-center justify-between text-sm">
              <span className="truncate">
                {i.selectedQuantity}× {i.name}
              </span>
              <span className="font-medium ml-2">
                ${((i.cost || 0) * i.selectedQuantity).toFixed(0)}
              </span>
            </div>
          ))}
          <div className="border-t border-border/60 pt-2 mt-2 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform fee (10%)</span>
              <span>${(total - subtotal).toFixed(0)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1">
              <span>Total</span>
              <span>${total.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      <Button
        size="lg"
        disabled={selectedItemsCount === 0}
        onClick={onProceedToCheckout}
        className="w-full"
      >
        Continue to checkout
      </Button>
      <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5 justify-center">
        <Check className={`h-3 w-3 ${accent}`} />
        You'll add player names on the next step.
      </p>
    </div>
  );
}

export function EventLanding(props: EventLandingProps) {
  const {
    eventFields,
    campaign,
    cart,
    attributedRosterMember,
    onUpdateQuantity,
    onProceedToCheckout,
    subtotal,
    total,
    selectedItemsCount,
    checkoutStep,
  } = props;

  // Once user advances past the cart step, fall back to SponsorshipLanding
  // (which owns the existing CheckoutStepsPanel for donor-info → payment).
  if (checkoutStep && checkoutStep !== "cart") {
    return <SponsorshipLanding {...props} />;
  }

  const [heroStatItems, setHeroStatItems] = useState<
    Array<{ id: string; label: string; sold: number; offered: number }>
  >([]);

  useEffect(() => {
    if (!campaign?.id) return;
    (async () => {
      const { data } = await supabase
        .from("campaign_items")
        .select("id, hero_stat_label, quantity_offered, quantity_available, show_in_hero_stats")
        .eq("campaign_id", campaign.id)
        .eq("show_in_hero_stats", true);
      setHeroStatItems(
        (data || []).map((i: any) => ({
          id: i.id,
          label: i.hero_stat_label || "Sold",
          sold: Math.max(0, (i.quantity_offered || 0) - (i.quantity_available || 0)),
          offered: i.quantity_offered || 0,
        })),
      );
    })();
  }, [campaign?.id]);

  const startAt = eventFields.event_start_at ? new Date(eventFields.event_start_at) : null;
  const dateLabel = startAt
    ? startAt.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const timeLabel = startAt
    ? `Starts at ${startAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
    : null;
  const teeOffShort = startAt
    ? `Tee-off ${startAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
    : null;

  const agenda = (eventFields.event_agenda || []).filter(
    (a) => a && (a.time || a.title || a.description),
  );

  const daysLeft = getDaysLeft(campaign.end_date);
  const goal = campaign.goal_amount || 0;
  const raised = campaign.amount_raised || 0;
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  const hasDetails =
    !!startAt ||
    !!eventFields.event_location_name ||
    !!eventFields.event_format ||
    (eventFields.event_includes && eventFields.event_includes.length > 0);

  const visibleItems = useMemo(() => cart || [], [cart]);

  const orgLabel = campaign.groups
    ? `${campaign.groups.schools?.school_name || ""} · ${campaign.groups.group_name || ""}`.trim()
    : "";

  const hasRosterPitch =
    attributedRosterMember &&
    (attributedRosterMember.pitchMessage ||
      attributedRosterMember.pitchImageUrl ||
      attributedRosterMember.pitchVideoUrl ||
      attributedRosterMember.pitchRecordedVideoUrl);

  return (
    <BrandedLandingWrapper branding={props.branding} className="min-h-screen bg-[hsl(var(--event-bg))]">
      {/* HERO — dark photo background */}
      <section className="relative text-white overflow-hidden">
        {campaign.image_url && (
          <div className="absolute inset-0">
            <img
              src={campaign.image_url}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />
          </div>
        )}
        {!campaign.image_url && <div className="absolute inset-0 bg-neutral-800" />}

        <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-8">
          <BrandLogoStrip
            branding={props.branding}
            orgName={[campaign.groups?.schools?.school_name, campaign.groups?.group_name].filter(Boolean).join(" • ") || null}
            variant="dark"
            className="mb-4"
          />
          {/* chips */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {campaign.campaign_type?.name || "Event"}
            </span>
            {campaign.groups?.group_name && (
              <span className={`text-xs px-2.5 py-1 rounded-full ${accentBg} text-white font-medium`}>
                {campaign.groups.group_name}
              </span>
            )}
            {eventFields.event_location_name && (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/80">
                <MapPin className="h-3 w-3" />
                {eventFields.event_location_name}
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
                <span className="text-xs text-white/70">
                  Goal: ${goal.toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/60 mb-2">
                {Math.round(progress)}% of goal
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
              <div className="text-2xl font-bold mt-1">${raised.toLocaleString()}</div>
            </div>
            {heroStatItems.slice(0, 2).map((s) => (
              <div key={s.id} className="rounded-lg border border-white/15 bg-black/30 backdrop-blur p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/60">{s.label}</div>
                <div className="text-2xl font-bold mt-1">{s.sold}</div>
                {s.offered > 0 && (
                  <div className="text-xs text-white/60 mt-0.5">of {s.offered}</div>
                )}
              </div>
            ))}
            {daysLeft != null && (
              <div className="rounded-lg border border-white/15 bg-black/30 backdrop-blur p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/60">Days Left</div>
                <div className="text-2xl font-bold mt-1">{daysLeft}</div>
                {teeOffShort && <div className="text-xs text-white/60 mt-0.5">{teeOffShort}</div>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TWO-COLUMN BODY */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {hasRosterPitch && attributedRosterMember && (
            <RosterPitchCard member={attributedRosterMember} />
          )}

          {hasDetails && (
            <section>
              <Eyebrow>The details</Eyebrow>
              <SectionHeading
                text={eventFields.event_details_heading || "A good day, outdoors."}
                accent={eventFields.event_details_heading_accent || "day"}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {startAt && (
                  <DetailTile icon={Calendar} label="Date" value={dateLabel} subtitle={timeLabel} />
                )}
                {eventFields.event_location_name && (
                  <DetailTile
                    icon={MapPin}
                    label="Where"
                    value={eventFields.event_location_name}
                    subtitle={eventFields.event_location_address}
                  />
                )}
                {eventFields.event_format && (
                  <DetailTile
                    icon={Trophy}
                    label="Format"
                    value={eventFields.event_format}
                    subtitle={eventFields.event_format_subtitle}
                  />
                )}
                {eventFields.event_includes && eventFields.event_includes.length > 0 && (
                  <DetailTile
                    icon={ListChecks}
                    label={eventFields.event_includes_heading || "Includes"}
                    value={eventFields.event_includes.join(" · ")}
                    subtitle={eventFields.event_includes_subtitle}
                  />
                )}
              </div>
            </section>
          )}

          {visibleItems.length > 0 && (
            <section>
              <Eyebrow>Tickets &amp; experiences</Eyebrow>
              <SectionHeading text="Pick your spot." accent="spot" />
              <div className="space-y-3">
                {visibleItems.map((item) => (
                  <TicketCard key={item.id} item={item} onUpdate={onUpdateQuantity} />
                ))}
              </div>
            </section>
          )}

          {agenda.length > 0 && (
            <section>
              <Eyebrow>Day-of agenda</Eyebrow>
              <SectionHeading
                text={eventFields.event_agenda_heading || "How the day runs."}
                accent={eventFields.event_agenda_heading_accent || "day"}
              />
              <div className="rounded-xl border border-border/60 bg-card divide-y">
                {agenda.map((row, i) => (
                  <div key={i} className="grid grid-cols-[90px_1fr] gap-4 p-4 items-start">
                    <div className={`font-mono text-xs ${accent} tracking-wide pt-0.5`}>
                      {row.time || ""}
                    </div>
                    <div>
                      {row.title && <div className="font-semibold text-sm">{row.title}</div>}
                      {row.description && (
                        <div className="text-xs text-muted-foreground mt-1">{row.description}</div>
                      )}
                    </div>
                  </div>
                ))}
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
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
