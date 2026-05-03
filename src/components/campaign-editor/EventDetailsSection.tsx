import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useState } from "react";

export interface AgendaItem {
  time?: string;
  title?: string;
  description?: string;
}

export interface EventDetailsData {
  eventStartAt: string; // datetime-local
  eventLocationName: string;
  eventLocationAddress: string;
  eventFormat: string;
  eventFormatSubtitle: string;
  eventIncludes: string[];
  eventIncludesSubtitle: string;
  eventAgenda: AgendaItem[];
  eventDetailsHeading?: string;
  eventDetailsHeadingAccent?: string;
  eventAgendaHeading?: string;
  eventAgendaHeadingAccent?: string;
  eventIncludesHeading?: string;
}

interface Props {
  data: EventDetailsData;
  onUpdate: (updates: Partial<EventDetailsData>) => void;
}

export function EventDetailsSection({ data, onUpdate }: Props) {
  const [chipDraft, setChipDraft] = useState("");

  const addChip = () => {
    const v = chipDraft.trim();
    if (!v) return;
    onUpdate({ eventIncludes: [...(data.eventIncludes || []), v] });
    setChipDraft("");
  };

  const removeChip = (i: number) => {
    onUpdate({ eventIncludes: data.eventIncludes.filter((_, idx) => idx !== i) });
  };

  const addAgendaRow = () => {
    onUpdate({ eventAgenda: [...(data.eventAgenda || []), { time: "", title: "", description: "" }] });
  };

  const updateAgendaRow = (i: number, patch: Partial<AgendaItem>) => {
    onUpdate({
      eventAgenda: data.eventAgenda.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    });
  };

  const removeAgendaRow = (i: number) => {
    onUpdate({ eventAgenda: data.eventAgenda.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input
          placeholder="Details heading (e.g. A good day, outdoors.)"
          value={data.eventDetailsHeading || ""}
          onChange={(e) => onUpdate({ eventDetailsHeading: e.target.value })}
        />
        <Input
          placeholder="Accent word (highlighted in heading)"
          value={data.eventDetailsHeadingAccent || ""}
          onChange={(e) => onUpdate({ eventDetailsHeadingAccent: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventStartAt">Event date & start time</Label>
          <Input
            id="eventStartAt"
            type="datetime-local"
            value={data.eventStartAt}
            onChange={(e) => onUpdate({ eventStartAt: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventLocationName">Location name</Label>
          <Input
            id="eventLocationName"
            placeholder="Pine Hills Golf Club"
            value={data.eventLocationName}
            onChange={(e) => onUpdate({ eventLocationName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventLocationAddress">Address</Label>
        <Input
          id="eventLocationAddress"
          placeholder="2400 Riverbend Rd, Lakewood"
          value={data.eventLocationAddress}
          onChange={(e) => onUpdate({ eventLocationAddress: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventFormat">Format</Label>
          <Input
            id="eventFormat"
            placeholder="4-person scramble"
            value={data.eventFormat}
            onChange={(e) => onUpdate({ eventFormat: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventFormatSubtitle">Format subtitle</Label>
          <Input
            id="eventFormatSubtitle"
            placeholder="All skill levels welcome"
            value={data.eventFormatSubtitle}
            onChange={(e) => onUpdate({ eventFormatSubtitle: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Includes</Label>
        <Input
          placeholder="Includes section heading (e.g. What's included)"
          value={data.eventIncludesHeading || ""}
          onChange={(e) => onUpdate({ eventIncludesHeading: e.target.value })}
        />
        <div className="flex flex-wrap gap-2">
          {(data.eventIncludes || []).map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {c}
              <button
                type="button"
                aria-label="Remove"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => removeChip(i)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add an inclusion (e.g. Cart)"
            value={chipDraft}
            onChange={(e) => setChipDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addChip();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addChip}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <Input
          placeholder="Includes subtitle (e.g. Prizes for top 3 teams + closest to pin)"
          value={data.eventIncludesSubtitle}
          onChange={(e) => onUpdate({ eventIncludesSubtitle: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Day-of agenda</Label>
          <Button type="button" variant="outline" size="sm" onClick={addAgendaRow}>
            <Plus className="h-4 w-4" /> Add agenda item
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input
            placeholder="Agenda heading (e.g. How the day runs.)"
            value={data.eventAgendaHeading || ""}
            onChange={(e) => onUpdate({ eventAgendaHeading: e.target.value })}
          />
          <Input
            placeholder="Accent word (highlighted in heading)"
            value={data.eventAgendaHeadingAccent || ""}
            onChange={(e) => onUpdate({ eventAgendaHeadingAccent: e.target.value })}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Add the schedule donors will see on the landing page.
        </p>
        <div className="space-y-2">
          {(data.eventAgenda || []).length === 0 && (
            <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
              No agenda items yet.
            </div>
          )}
          {(data.eventAgenda || []).map((row, i) => (
            <div key={i} className="grid grid-cols-[auto_120px_1fr_auto] gap-2 items-start border rounded-md p-3">
              <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5" />
              <Input
                placeholder="7:30 AM"
                value={row.time || ""}
                onChange={(e) => updateAgendaRow(i, { time: e.target.value })}
              />
              <div className="space-y-1.5">
                <Input
                  placeholder="Title (e.g. Check-in & range opens)"
                  value={row.title || ""}
                  onChange={(e) => updateAgendaRow(i, { title: e.target.value })}
                />
                <Textarea
                  placeholder="Optional description"
                  rows={2}
                  value={row.description || ""}
                  onChange={(e) => updateAgendaRow(i, { description: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAgendaRow(i)}
                aria-label="Remove agenda item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}