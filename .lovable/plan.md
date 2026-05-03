## Event Fundraiser Template

Build a dedicated `EventLanding` template for `campaign_type = 'Event'`, mirroring the mockup (Booster Club Golf Scramble), and add the event-specific data model + editor section needed to power it.

### 1. Database additions (campaigns table)

Add new event-specific columns (all nullable, only used for Event campaigns):

- `event_start_at timestamptz` — full date + start time (replaces just-a-date for events; existing `start_date` still drives campaign go-live).
- `event_location_name text` — e.g. "Pine Hills Golf Club".
- `event_location_address text` — e.g. "2400 Riverbend Rd, Lakewood".
- `event_format text` — e.g. "4-person scramble".
- `event_format_subtitle text` — e.g. "All skill levels welcome".
- `event_includes text[]` — chips like ["Cart","Lunch","Range balls"].
- `event_includes_subtitle text` — e.g. "Prizes for top 3 teams + closest to pin".
- `event_agenda jsonb` — ordered list: `[{ time, title, description }]`.

No RLS changes needed (campaigns RLS already covers these columns).

### 2. New landing template

Create `src/components/campaign-landing/event/EventLanding.tsx` matching the mockup:

- **Dark hero** with background image + overlay: "Event" pill, "Counting now"-style status, location chip, accented headline, description, raised vs goal progress bar, and 4 stat tiles (Raised, Teams Sold / Items Sold, Hole Sponsors / secondary item, Days Left / event date).
- **Pitch card** (left) — reuses existing pitch (coach photo, quote, video, attribution stats) when a roster member is attributed. Same component pattern as Sponsorship/Donation.
- **Sticky "Your tickets" cart** (right) — running list of selected items, quantity + line totals, "Continue to checkout" CTA. Disabled empty state matches mockup.
- **Details block** — "A good day, outdoors." 2x2 grid of: Date, Where, Format, Includes (driven by new fields).
- **Tickets & Experiences** — list of `campaign_items` rendered with title, description, feature checks (from item `features` if present, otherwise from a short description split), price, "X of Y left" inventory hint, and quantity stepper.
- **Day-of Agenda** — vertical timeline rendered from `event_agenda` jsonb.
- **Footer** — reuses standard MarketingFooter pattern from other landing templates.

Reuses `landingHelpers.tsx` (`formatHeadline`, `StatTile`, `getDaysLeft`, `getVideoEmbedUrl`).

### 3. Cart + checkout

- Local cart state in `EventLanding` (item id → qty), feeds into existing `create-stripe-checkout` edge function exactly the way `SponsorshipLanding` does for multi-item carts (no edge function changes).
- Honors `attributedRosterMember` when present (via `/p/...` URL).
- Honors existing `donation_allow_dedication` is N/A here; nothing new on Stripe side.

### 4. Editor changes

- **New section**: `src/components/campaign-editor/EventDetailsSection.tsx` with inputs for: event date + start time (single datetime-local), location name, address, format, format subtitle, includes (chip list editor), includes subtitle, and a sortable agenda editor (time / title / description rows with add/remove).
- **CampaignSectionNav**: add `eventDetails` key shown only when campaign type is Event (parallel to `pledgeSettings`).
- **CampaignEditor.tsx**:
  - Add `eventTypeId` lookup (same pattern as `pledgeTypeId`) and `isEventCampaign` flag.
  - Extend `CampaignData` with the new event fields and load/save them in the existing fetch and `handleSave` flows.
  - Pass `isEvent` / `showEventDetails` to `CampaignSectionNav`.
  - Render `EventDetailsSection` when `activeSection === "eventDetails"`.
- **BasicDetailsSection**: when type is Event, label the existing end-date field as "Sales close date" and add a hint that the event date itself lives in the new Event Details section.

### 5. Routing

Update `src/pages/CampaignLanding.tsx` to render `EventLanding` when `campaign.campaign_type?.name?.toLowerCase() === 'event'`, alongside the existing donation/pledge/sponsorship branches; exclude Event from the legacy items-based branch.

### Files

- new: `supabase/migrations/<ts>_add_event_campaign_fields.sql`
- new: `src/components/campaign-landing/event/EventLanding.tsx`
- new: `src/components/campaign-editor/EventDetailsSection.tsx`
- edit: `src/pages/CampaignLanding.tsx`
- edit: `src/pages/CampaignEditor.tsx`
- edit: `src/components/campaign-editor/CampaignSectionNav.tsx`
- edit: `src/components/campaign-editor/BasicDetailsSection.tsx` (label nuance only)
