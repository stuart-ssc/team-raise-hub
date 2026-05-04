## Goal

Make event-agenda collection a **dedicated, item-style sub-flow** in the AI Fundraiser Assistant — mirroring how `campaign_items` are added one-at-a-time after the draft is created — instead of asking for the agenda inline as a single field.

## Current behavior

In `supabase/functions/ai-campaign-builder/index.ts`, Event setup (`eventStillToAsk`) walks: `event_start_at → event_location_name → event_location_address → event_format → event_includes`, then jumps to items collection (tickets). **Agenda is never asked**, even though `EventDetailsSection.tsx` exposes a structured `eventAgenda: AgendaItem[]` (`time`, `title`, `description`).

## Proposed flow

After `event_includes` is resolved (and before the items/tickets phase begins), enter a new **Agenda phase** that behaves like the items-collection phase:

```text
Event fields → "Want to add an agenda for the day?" (Yes / Skip)
   ├─ Skip → continue to ticket items
   └─ Yes → loop:
        - Ask: time   (e.g. "7:30 AM")
        - Ask: title  (e.g. "Check-in & range opens")
        - Ask: description (optional, with Skip)
        - Save row → "Agenda item saved. Add another or done?" (Add another / Done)
   → on Done → continue to ticket items
```

UI affordances reuse the existing `SuggestionPrompt` chips (Yes/No, Skip, Add another / Done) so the user is never typing free-form when a button will do.

## Technical changes

### 1. `supabase/functions/ai-campaign-builder/index.ts`

- **New phase**: introduce `phase: "collecting_agenda"` alongside `collecting_items`. Triggered when `isEvent && eventFieldsDone && !collectedFields.event_agenda_complete`.
- **State on `collectedFields`**:
  - `event_agenda_addressed: boolean` — set true once user opts in or skips
  - `event_agenda_complete: boolean` — set true when user clicks "Done"
  - `current_agenda_draft: { time?, title?, description?, description_skipped? }`
  - The persisted `event_agenda` array lives on `campaigns.event_agenda` (jsonb) — we append to it each time a row is saved.
- **New system prompt builder** `buildAgendaSystemPrompt(...)` modeled after `buildItemsSystemPrompt`, walking three fields (`time`, `title`, `description`) with one-question-at-a-time turns and the same two-paragraph response format.
- **New tools** (active only in agenda phase, like `itemsTools`):
  - `update_agenda_field` — `{ time?, title?, description?, description_skipped? }`
  - `save_agenda_item` — appends `current_agenda_draft` to `campaigns.event_agenda` (read-modify-write, since the column is jsonb), then clears the draft and flips to "awaiting add another"
  - `agenda_complete` — sets `event_agenda_complete: true`
- **Entry prompt** (between event fields and agenda loop): "Want to add a day-of agenda? (Add agenda / Skip)" via `SuggestionPrompt` chips. Choosing Skip sets both `event_agenda_addressed` and `event_agenda_complete` true.
- **Phase routing** (around line 2153 `let phase = ...`): after event fields are done, set `phase = "collecting_agenda"` until `event_agenda_complete`, then fall through to `collecting_items` (tickets).

### 2. `src/lib/ai/campaignSchema.ts`

- Add a small helper `isEventAgendaComplete(collected)` for the frontend preview/state machine, plus optional fields `event_agenda_addressed`, `event_agenda_complete` so they round-trip via `collectedFields`.

### 3. `src/components/AddCampaignForm.tsx`

- No new column — `event_agenda` already maps. Confirm the post-AI save path passes the accumulated `event_agenda` array through (it already does for editor saves; the edge function will write it directly during the loop, so the frontend just needs to not overwrite it).

### 4. `src/components/ai-campaign/AICampaignPreview.tsx`

- Render the `event_agenda` rows under the existing "Event details" group as a compact bulleted list (`HH:MM — Title`), updating live as each row is saved.

### 5. `src/components/ai-campaign/AIChatPanel.tsx` / `SuggestionPrompt.tsx`

- No structural change. The new agenda phase reuses the existing `ChatSuggestions` `choice` type for Yes/Skip and Add another/Done chips.

## Out of scope

- Heading/accent overrides (`eventAgendaHeading`, `eventAgendaHeadingAccent`) — editor-only, unchanged.
- Reordering of agenda rows in chat (user can reorder later in the editor).
- Inline editing of a saved agenda row mid-chat (must be done in the editor).

## Files touched

- `supabase/functions/ai-campaign-builder/index.ts`
- `src/lib/ai/campaignSchema.ts`
- `src/components/ai-campaign/AICampaignPreview.tsx`
- `src/components/AddCampaignForm.tsx` (verification only — likely no change)

No DB migration required (`event_agenda` column already exists).