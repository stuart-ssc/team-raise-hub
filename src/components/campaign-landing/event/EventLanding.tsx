import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Trophy, ListChecks, Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  SponsorshipLanding,
  SponsorshipLandingProps,
  SponsorshipItem,
} from "@/components/campaign-landing/sponsorship/SponsorshipLanding";
import { formatHeadline } from "@/components/campaign-landing/shared/landingHelpers";

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
    <div className="rounded-xl border border-border/60 bg-card p-5 flex items-start gap-4">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        {value && <div className="font-semibold text-base mt-1 leading-tight">{value}</div>}
        {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
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
    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-3 py-1.5">
      <button
        type="button"
        onClick={dec}
        disabled={value <= 0}
        className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-40"
        aria-label="Decrease"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="font-semibold text-base w-6 text-center">{value}</span>
      <button
        type="button"
        onClick={inc}
        className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        aria-label="Increase"
      >
        <Plus className="h-4 w-4" />
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
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-2xl font-medium tracking-tight">{item.name}</h3>
          {item.description && (
            <p className="text-muted-foreground mt-1.5">{item.description}</p>
          )}
          {item.feature_bullets && item.feature_bullets.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {item.feature_bullets.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-sm">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="md:text-right md:min-w-[140px] flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3">
          <div>
            <div className="font-serif italic text-3xl text-primary leading-none">
              ${(item.cost || 0).toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5">{remainingLabel}</div>
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">
      {children}
    </p>
  );
}

function SectionHeading({
  text,
  accent,
}: {
  text: string;
  accent?: string | null;
}) {
  return (
    <h2 className="font-serif text-4xl md:text-5xl tracking-tight mb-8">
      {formatHeadline(text, accent || undefined)}
    </h2>
  );
}

export function EventLanding(props: EventLandingProps) {
  const {
    eventFields,
    campaign,
    cart,
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

  return (
    <div className="min-h-screen bg-[hsl(var(--event-bg))]">
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-10">
        <Eyebrow>{campaign.campaign_type?.name || "Event"}</Eyebrow>
        <h1 className="font-serif text-5xl md:text-6xl tracking-tight leading-[1.05] mb-5">
          {formatHeadline(campaign.name, campaign.hero_accent_word)}
        </h1>
        {campaign.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">{campaign.description}</p>
        )}

        {goal > 0 && (
          <div className="max-w-xl space-y-2 mb-6">
            <div className="flex items-baseline justify-between">
              <span className="font-serif italic text-2xl text-primary">
                ${raised.toLocaleString()}
                <span className="text-sm not-italic font-sans text-muted-foreground ml-2">
                  raised of ${goal.toLocaleString()}
                </span>
              </span>
              {daysLeft != null && (
                <span className="text-sm text-muted-foreground">
                  {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                </span>
              )}
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {heroStatItems.length > 0 && (
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {heroStatItems.map((s) => (
              <div key={s.id}>
                <span className="font-semibold">
                  {s.sold}
                  {s.offered > 0 && <span className="text-muted-foreground"> / {s.offered}</span>}
                </span>{" "}
                <span className="text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DETAILS */}
      {hasDetails && (
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <Eyebrow>The details</Eyebrow>
          <SectionHeading
            text={eventFields.event_details_heading || "A good day, outdoors."}
            accent={eventFields.event_details_heading_accent || "day"}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* TICKETS */}
      {visibleItems.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <Eyebrow>Tickets &amp; experiences</Eyebrow>
          <SectionHeading text="Pick your spot." accent="spot" />
          <div className="space-y-4">
            {visibleItems.map((item) => (
              <TicketCard key={item.id} item={item} onUpdate={onUpdateQuantity} />
            ))}
          </div>
        </section>
      )}

      {/* AGENDA */}
      {agenda.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-32">
          <Eyebrow>Day-of agenda</Eyebrow>
          <SectionHeading
            text={eventFields.event_agenda_heading || "How the day runs."}
            accent={eventFields.event_agenda_heading_accent || "day"}
          />
          <div className="rounded-xl border border-border/60 bg-card divide-y">
            {agenda.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[110px_1fr] gap-4 p-5 items-start"
              >
                <div className="font-mono text-sm text-primary tracking-wide pt-0.5">
                  {row.time || ""}
                </div>
                <div>
                  {row.title && <div className="font-semibold">{row.title}</div>}
                  {row.description && (
                    <div className="text-sm text-muted-foreground mt-1">{row.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STICKY CHECKOUT BAR */}
      {selectedItemsCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">
                {selectedItemsCount} item{selectedItemsCount === 1 ? "" : "s"} selected
              </div>
              <div className="font-serif italic text-2xl text-primary leading-none mt-0.5">
                ${total.toFixed(0)}
                <span className="text-sm not-italic font-sans text-muted-foreground ml-2">
                  (${subtotal.toFixed(0)} + 10% fee)
                </span>
              </div>
            </div>
            <Button size="lg" onClick={onProceedToCheckout} className="rounded-full px-6">
              Continue to checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
