# Event Template — Revised Enhancements

Clarification applied: the person/photo + message + video block on the event landing is the **roster-enabled P2P pitch card** (rendered only when the visitor lands via a roster member URL like `/c/{slug}/p/{member}`). Ignore the leaderboard/rank/raised stats inside that card.

## 1. Database

**`campaign_items`** — support hero rollups + attendee capture
- `show_in_hero_stats boolean default false`
- `hero_stat_label text` (e.g. "Teams", "Sponsors")
- `collect_attendee_names boolean default false`
- `attendees_per_unit int default 1`

**`campaigns`** — editable section copy
- `event_details_heading text`, `event_details_heading_accent text`
- `event_agenda_heading text`, `event_agenda_heading_accent text`
- `event_includes_heading text`

**`organization_user`** — roster member title
- `title text` (e.g. "Head Coach", "Team Captain")

**`orders`** — already JSONB-friendly; reuse existing `attendees jsonb` if present, otherwise add `attendees jsonb` for `[{ item_id, name }]`.

## 2. Roster-enabled Pitch Card (EventLanding)

Render only when `rosterMember` is present in route context.
- Left: square photo from `organization_user.avatar_url` (fallback initials).
- Right:
  - Name + `title` (new field) under name.
  - Personal `pitch_message` (existing roster field).
  - Optional `pitch_video_url` rendered as embedded player (YouTube/Vimeo/MP4 detection).
- No stats, no leaderboard, no raised amount inside this card.
- Falls back to hidden when no roster member context.

## 3. Hero Stats

Replace hardcoded 4-stat grid with dynamic tiles:
- Always: Raised, Days Left.
- Plus one tile per `campaign_items` row where `show_in_hero_stats = true`, formatted `"{sold} of {inventory} {hero_stat_label}"` (or just `{sold} {label}` if no inventory).

## 4. Checkout — Attendee Capture

When cart contains an item with `collect_attendee_names = true`:
- After ticket selection, before payment, show an "Attendees" step.
- Render `qty * attendees_per_unit` name inputs grouped per item.
- Persist into `orders.attendees` JSONB; pass through `create-stripe-checkout` metadata.

## 5. Editor Updates

- **`EventDetailsSection.tsx`** — add inputs for editable headings/accents.
- **`CampaignItemsSection.tsx`** — per-item toggles: `show_in_hero_stats`, `hero_stat_label`, `collect_attendee_names`, `attendees_per_unit`.
- **Roster member edit form** — add `title` field; `pitch_message` and `pitch_video_url` already exist (verify and expose if missing).

## 6. Routing / Display

No new routes. `EventLanding` reads `rosterMember` from existing campaign-landing context (same pattern as `PledgeLanding`/`SponsorshipLanding`).

## Files to touch

- New migration: `campaign_items` + `campaigns` + `organization_user` columns
- `src/components/campaign-landing/event/EventLanding.tsx` — pitch card + dynamic hero stats
- `src/components/campaign-editor/EventDetailsSection.tsx` — new heading fields
- `src/components/campaign-editor/CampaignItemsSection.tsx` — per-item event flags
- Roster member editor (locate existing component) — add `title`
- Checkout flow components + `create-stripe-checkout` edge function — attendees step + metadata
- `src/integrations/supabase/types.ts` — regenerate types

Approve to proceed.
