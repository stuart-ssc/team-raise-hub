import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Trophy, ListChecks } from "lucide-react";
import {
  SponsorshipLanding,
  SponsorshipLandingProps,
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

function DetailTile({
  icon: Icon,
  label,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title?: string | null;
  subtitle?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          {title && <div className="font-semibold mt-0.5 truncate">{title}</div>}
          {children}
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EventLanding(props: EventLandingProps) {
  const { eventFields, ...rest } = props;

  const startAt = eventFields.event_start_at
    ? new Date(eventFields.event_start_at)
    : null;
  const dateLabel = startAt
    ? startAt.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const timeLabel = startAt
    ? startAt.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const hasDetails =
    !!startAt ||
    !!eventFields.event_location_name ||
    !!eventFields.event_format ||
    (eventFields.event_includes && eventFields.event_includes.length > 0);

  const agenda = (eventFields.event_agenda || []).filter(
    (a) => a && (a.time || a.title || a.description),
  );

  return (
    <>
      <SponsorshipLanding {...rest} />

      {hasDetails && (
        <section className="max-w-6xl mx-auto px-6 pb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            The details
          </p>
          <h2 className="text-3xl font-bold mb-6">
            {formatHeadline(
              eventFields.event_details_heading || "A good day, outdoors.",
              eventFields.event_details_heading_accent || "day",
            )}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {startAt && (
              <DetailTile
                icon={Calendar}
                label="Date"
                title={dateLabel || ""}
                subtitle={timeLabel ? `Starts at ${timeLabel}` : undefined}
              />
            )}
            {eventFields.event_location_name && (
              <DetailTile
                icon={MapPin}
                label="Where"
                title={eventFields.event_location_name}
                subtitle={eventFields.event_location_address || undefined}
              />
            )}
            {eventFields.event_format && (
              <DetailTile
                icon={Trophy}
                label="Format"
                title={eventFields.event_format}
                subtitle={eventFields.event_format_subtitle || undefined}
              />
            )}
            {eventFields.event_includes && eventFields.event_includes.length > 0 && (
              <DetailTile
                icon={ListChecks}
                label={eventFields.event_includes_heading || "Includes"}
                subtitle={eventFields.event_includes_subtitle || undefined}
              >
                <div className="font-semibold mt-0.5 truncate">
                  {eventFields.event_includes.join(" · ")}
                </div>
              </DetailTile>
            )}
          </div>
        </section>
      )}

      {agenda.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            Day-of agenda
          </p>
          <h2 className="text-3xl font-bold mb-6">
            {formatHeadline(
              eventFields.event_agenda_heading || "How the day runs.",
              eventFields.event_agenda_heading_accent || "day",
            )}
          </h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {agenda.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[90px_1fr] gap-4 p-4 items-start"
                >
                  <div className="font-mono text-sm text-primary">
                    {row.time || ""}
                  </div>
                  <div>
                    {row.title && <div className="font-semibold">{row.title}</div>}
                    {row.description && (
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {row.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </>
  );
}