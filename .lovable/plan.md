# Sync AI Fundraiser Assistant with new type-specific fields

## Background

The campaign editor (`src/pages/CampaignEditor.tsx`) now renders extra sections that the AI assistant does not yet ask about:

- **Merchandise Sale** → `MerchandiseFulfillmentSection`: `merchShipsByDate`, `merchShippingFlatRate`, `merchPickupAvailable`, `merchPickupNote`
- **Event** → `EventDetailsSection`: `eventStartAt`, `eventLocationName`, `eventLocationAddress`, `eventFormat`, `eventFormatSubtitle`, `eventIncludes[]`, `eventIncludesSubtitle`, `eventAgenda[]` (+ heading/accent overrides)
- **Pledge** → `PledgeSettingsSection`: already partially handled — missing `pledge_unit_label_plural` and `pledge_suggested_unit_amounts` in the AI flow

Today the AI builder (`supabase/functions/ai-campaign-builder/index.ts` + `src/lib/ai/campaignSchema.ts`) only walks shared fields + 3 pledge fields. AI-created Merch / Event / fully-detailed Pledge campaigns require the user to drop into the editor afterward.

## Goal

After campaign-type selection, the assistant branches and asks the relevant type-specific questions before (or alongside) item collection, persisting via the existing `update_campaign_fields` tool call so the editor sections come pre-filled.

## Scope of changes

### 1. `src/lib/ai/campaignSchema.ts` (frontend schema)
Add three new field arrays + helpers, mirroring the existing `pledgeFields` pattern:

- `merchandiseFields`: `merch_ships_by_date` (date, optional), `merch_shipping_flat_rate` (number, optional), `merch_pickup_available` (boolean, required), `merch_pickup_note` (string, optional, depends on `merch_pickup_available === true`).
- `eventFields`: `event_start_at` (datetime, required), `event_location_name` (string, required), `event_location_address` (string, optional), `event_format` (string, optional), `event_format_subtitle` (string, optional), `event_includes` (string list, optional — comma-separated input), `event_includes_subtitle` (string, optional), `event_agenda` (structured list, optional — collected as free-text "time | title | description" rows or skipped). Heading/accent overrides stay editor-only (not asked by AI).
- Extend `pledgeFields` with `pledge_unit_label_plural` (string, optional, auto-suggest `${pledge_unit_label}s`) and `pledge_suggested_unit_amounts` (already declared in mirror but not in `pledgeFields` — ensure parity and parsing into `number[]`).

Add helpers:
- `isMerchandiseType(name)`, `isEventType(name)`
- Update `getRequiredFieldsForType` / `getMissingRequiredFields` / `isReadyToCreate` so each type pulls in its own required keys.

### 2. `supabase/functions/ai-campaign-builder/index.ts` (assistant logic)
Mirror the schema additions in the edge function (it currently keeps its own copy of pledge metadata around line 343):

- Add `MERCH_FIELDS`, `EVENT_FIELDS`, and extended `PLEDGE_FIELDS` arrays with `aiDescription`, `key`, `required`, and a `prompt` string (used by `nextStep`).
- Add `isMerchandiseTypeName`, `isEventTypeName` and `getMerchStillToAsk`, `getEventStillToAsk`, `getPledgeStillToAsk` (extend existing).
- In the `nextStep` chain (currently the `if (sponsorAssetsRequired …) else if (isPledge && !pledgeFieldsDone) …` block, ~line 510–550), insert two new branches:
  - `else if (isMerchandise && !merchFieldsDone)` → ask merch questions one at a time with quick-pick UI (Yes/No for pickup; Skip for date/flat-rate/note).
  - `else if (isEvent && !eventFieldsDone)` → ask event questions one at a time. Agenda is collected as a loop (`add_agenda_item` tool field, similar to existing `add_required_asset` for sponsor assets) terminated by "done".
- Order: collect campaign-type-specific fields **before** moving on to items. For Pledge, keep the existing behaviour of skipping items entirely.
- Update the `update_campaign_fields` tool JSON schema (~line 1330) to include all new keys plus `add_agenda_item` (object with `time`, `title`, `description`) and `event_includes` (array).
- Update `detectFieldFromAssistantText` regex catalog so user replies map back to the right field even if the model phrases the question loosely.
- Update the system prompt's "still to ask about" rendering to include the new keys with the same numbering convention.

### 3. `src/components/AddCampaignForm.tsx` (post-AI save path)
Where AI-collected fields get written into the campaign insert/update payload, map the new schema keys to the existing DB columns used by `CampaignEditor`:

- merch: `merch_ships_by_date`, `merch_shipping_flat_rate`, `merch_pickup_available`, `merch_pickup_note`
- event: `event_start_at`, `event_location_name`, `event_location_address`, `event_format`, `event_format_subtitle`, `event_includes` (jsonb array), `event_includes_subtitle`, `event_agenda` (jsonb array)
- pledge: `pledge_unit_label_plural`, `pledge_suggested_unit_amounts` (numeric[])

This ensures the campaign created via the chat opens in the editor with the new sections fully populated.

### 4. `src/components/ai-campaign/AICampaignPreview.tsx` (preview chips)
Add display rows for the new fields so users see them confirmed in the right-hand preview panel as the AI collects them. Group under "Merchandise fulfillment", "Event details", "Pledge settings" sub-headings. Format dates with `formatFieldValue` and lists/agenda as compact bullet rows.

## Conversation flow (after this change)

```text
[shared fields] → campaign_type_id chosen
  ├─ Sponsorship → existing sponsor-asset flow → items
  ├─ Merchandise → ask: ships-by, flat shipping, pickup yes/no (+ note) → items
  ├─ Event       → ask: date/time, location, address, format (+ subtitle),
  │                includes (loop), includes subtitle,
  │                agenda (loop: time/title/desc, terminate on "done")
  │              → items (tickets)
  ├─ Pledge      → unit (sing+plural), scope, event date,
  │                min per unit, suggested amounts → DONE (no items)
  └─ Donation    → unchanged → items
```

## Out of scope
- Heading/accent overrides for event sections (purely cosmetic, editor-only).
- Custom fields (`CustomFieldsSection`) — separate feature, ask later if requested.
- Reordering existing sponsor-asset / pledge logic beyond inserting the new branches.

## Files touched
- `src/lib/ai/campaignSchema.ts`
- `supabase/functions/ai-campaign-builder/index.ts`
- `src/components/AddCampaignForm.tsx`
- `src/components/ai-campaign/AICampaignPreview.tsx`

No DB migrations required — the underlying campaign columns already exist (used by `CampaignEditor`).
