
## Goal
Replace the single-send "Contact about Fundraiser" flow with an automatic drip campaign that enrolls each selected donor and keeps emailing them until they donate to the chosen fundraiser or the campaign ends. Skip the Compose step — copy is generated automatically with a student-first (then team/group) tone, and every email is clearly powered by Sponsorly.

## What the user gets

### Trigger points (unchanged from prior plan)
- `Donors` page → select donors → toolbar `Contact about Fundraiser`.
- `DonorListDetail` header → `Contact about Fundraiser` (uses all list members).
- `DonorSegmentation` row action → same dialog for a whole list.

### New `ContactFundraiserDialog` — 2 steps (compose step removed)
1. **Pick a fundraiser** — searchable list of `published` campaigns scoped to the active org/group. Shows name, group/team, hero image, raised vs goal, and an end-date badge. Disabled if `campaign_end_date` is in the past.
2. **Review & enroll** — shows:
   - Recipient count (after suppression / opt-out filtering).
   - Auto-generated cadence preview based on `campaign_end_date` (e.g., "5 emails over 6 weeks: weekly until the final week, then 3 in the final 7 days").
   - A read-only sample of the first email rendered with branding and the student-first tone.
   - `Enroll N donors` confirm button.

### Drip cadence (computed at enrollment)
- `daysRemaining = campaign_end_date - today` (date-only, org timezone).
- Build a schedule:
  - **Final 7 days**: schedule exactly 3 emails — Day-7 "Final week", Day-3 "48 hours left", Day-1 "Last chance tonight".
  - **Before the final 7 days**: schedule weekly emails (every 7 days), starting immediately, stopping before entering the final-7-day window.
- First email is queued for immediate send; subsequent emails get a `scheduled_send_at` timestamp.
- Hard cap: max 8 total emails per enrollment (safety against very long campaigns).
- If `daysRemaining <= 0` at enrollment time → block in UI.
- If `daysRemaining < 7` → only the final-week sequence is scheduled (whatever fits).

### Auto-stop conditions
A scheduled email is skipped (and the enrollment marked `completed`) when any of these are true at send time:
- The recipient has a `completed` order on this campaign (any roster attribution).
- The campaign is no longer `published` or `campaign_end_date` has passed.
- The recipient is in `suppressed_emails` or has `email_opt_out = true`.
- The recipient unsubscribed from this specific enrollment via the per-email unsubscribe link.

### Email content (student-first, then team/group, powered by Sponsorly)
For each scheduled send, the function picks the **owner of the donor relationship** in this priority order:
1. **Student/participant owner** — if the donor was created/linked through a participant (donor_profiles.created_by → organization_user where user_type permission_level is `participant`), OR if the *sender* of the campaign enrollment is a participant on the chosen campaign's roster.
2. **Group/team** (e.g., "Lincoln Eagles Baseball").
3. **Organization** (school/nonprofit name) as fallback.

The body always leads with the student when one exists, then frames the ask around the team/group, then the organization. The email always ends with "Powered by Sponsorly".

#### Email template structure
```text
+-------------------------------------------------------+
|  [Org or Team Logo]                  Sponsorly mark  |
+-------------------------------------------------------+
|  [ Campaign Hero Image ]                             |
|  Campaign Name                                       |
+-------------------------------------------------------+
|  Hi {firstName | "there"},                           |
|                                                      |
|  -- If student owner exists: --                      |
|  {Student First Name} is fundraising for             |
|  {Team/Group Name} and would love your support.      |
|  {Optional: roster pitch message}                    |
|  {Optional: "Watch their video" link}                |
|                                                      |
|  -- Else: --                                         |
|  {Team/Group Name} is raising funds for {campaign}.  |
|                                                      |
|  Auto-generated context line based on cadence stage  |
|  (intro / weekly check-in / final week / final 48h / |
|   last chance).                                      |
+-------------------------------------------------------+
|              [ Support {Student or Team} ]           |
|     -> https://sponsorly.io/c/{slug}[/{rosterSlug}]  |
+-------------------------------------------------------+
|  Powered by Sponsorly · Org address ·                |
|  Unsubscribe from this campaign                      |
+-------------------------------------------------------+
```

Cadence-stage copy is a small pre-written set keyed by `(stage, hasStudent)`:
- `intro`, `weekly`, `final_week`, `final_48h`, `last_chance`.

All variable substitution (`{firstName}`, `{studentFirstName}`, `{teamName}`, `{campaignName}`) is done server-side and HTML-escaped via the existing `textToSafeHtml` helper.

### Roster attribution & CTA URL
Same resolution as before:
1. Most recent `orders.roster_member_id` for this donor + campaign.
2. Else, sender's own roster membership on this campaign.
3. Else, plain campaign URL.

CTA → `/c/{campaign_slug}` or `/c/{campaign_slug}/{rosterSlug}` when applicable.

## Database changes (migration tool)

New tables to track drip enrollments and scheduled sends:

- `fundraiser_outreach_enrollments`
  - `id uuid pk`
  - `organization_id uuid not null`
  - `campaign_id uuid not null references campaigns(id)`
  - `donor_id uuid not null references donor_profiles(id)`
  - `enrolled_by_user_id uuid not null`
  - `enrolled_by_organization_user_id uuid` (used to detect "sender is a participant")
  - `student_organization_user_id uuid` (resolved owner participant, if any)
  - `roster_member_id uuid` (resolved at enrollment for stable URL)
  - `status text not null default 'active'` — `active | completed | stopped | unsubscribed`
  - `completion_reason text` — `donated | campaign_ended | unsubscribed | suppressed | manual`
  - `created_at`, `updated_at`
  - Unique `(campaign_id, donor_id)` — re-enrolling the same donor on the same campaign reactivates instead of duplicating.

- `fundraiser_outreach_sends`
  - `id uuid pk`
  - `enrollment_id uuid not null references fundraiser_outreach_enrollments(id) on delete cascade`
  - `stage text not null` — `intro | weekly | final_week | final_48h | last_chance`
  - `scheduled_send_at timestamptz not null`
  - `sent_at timestamptz`
  - `status text not null default 'scheduled'` — `scheduled | sent | skipped | failed`
  - `skip_reason text`
  - `resend_email_id text`
  - `created_at`

- RLS: org admins/program managers can read enrollments for their org (via `organization_user`); only the edge function (service role) writes. Participants cannot read enrollment tables (these are CRM-side data).

## New / modified files

### New
- `src/components/ContactFundraiserDialog.tsx` — 2-step dialog (pick → review/enroll). Accepts `donorIds` or `listId`.
- `supabase/functions/enroll-fundraiser-outreach/index.ts` — JWT-verified. Resolves recipients (filters opt-outs/suppressed), resolves student owner + roster attribution per recipient, computes drip schedule from `campaign_end_date`, upserts `fundraiser_outreach_enrollments`, inserts `fundraiser_outreach_sends`, and immediately invokes the dispatcher to send the `intro` email.
- `supabase/functions/dispatch-fundraiser-outreach/index.ts` — service-role dispatcher run by pg_cron. Pulls due `fundraiser_outreach_sends` (status `scheduled`, `scheduled_send_at <= now()`), checks auto-stop conditions per row, renders the branded HTML, sends via Resend in batches of 25, logs to `email_delivery_log` with `email_type='fundraiser_outreach'`, and updates row + enrollment state.
- `supabase/functions/_shared/fundraiser-outreach-template.ts` — pure helper that returns HTML for a given `(campaign, owner, stage, recipient, ctaUrl)` payload. XSS-safe via `textToSafeHtml`.
- pg_cron job `dispatch-fundraiser-outreach-every-15-min` calling the dispatcher.

### Modified
- `src/pages/Donors.tsx` — replace toast with `setContactFundraiserDialogOpen(true)`.
- `src/components/DonorListDetail.tsx` — header button opening the dialog with `listId`.
- `src/pages/DonorSegmentation.tsx` — list-row action opening the dialog with `listId`.

### Untouched
- `bulk-email-donors` (generic raw email) stays as-is.
- `BulkActionToolbar` already exposes `onContactFundraiser`.

## Technical details

**Schedule computation (server-side)**
```text
endDate = campaign.campaign_end_date (date)
daysRemaining = endDate - today
schedule = []
if daysRemaining <= 0: reject
finalWindowStart = endDate - 7 days

# Pre-final-week weekly cadence
cursor = today
while cursor < finalWindowStart and len(schedule) < 5:
  schedule.append({stage: 'intro' if cursor==today else 'weekly', at: cursor})
  cursor += 7 days

# Final week: 3 emails
schedule.append({stage: 'final_week', at: max(today, endDate - 7 days)})
schedule.append({stage: 'final_48h', at: max(today, endDate - 3 days)})
schedule.append({stage: 'last_chance', at: max(today, endDate - 1 day)})
schedule = dedupe by 'at' (keep latest stage), cap to 8
```

**Donation auto-stop check (per scheduled row, at dispatch time)**
```text
EXISTS orders WHERE campaign_id = X AND donor_id = recipient.id
              AND status = 'completed'
```
If true → mark send `skipped` with `skip_reason='donated'`, mark enrollment `completed` with `completion_reason='donated'`, cancel all later scheduled rows for that enrollment.

**Student owner resolution**
1. `donor_profiles.created_by_organization_user_id` (if present and that org_user is a participant) → use that org_user's profile (first_name) and roster pitch.
2. Else, recipient's most recent `orders.roster_member_id` for any campaign in this org → derive participant.
3. Else, sender's own roster membership on this campaign.
4. Else, no student → team/group framing only.

**Rate limiting**
- Dispatcher batches 25 sends, 1.1s between batches. Cron every 15 minutes is sufficient; first email is sent inline at enrollment time so users see immediate effect.

**Security**
- All user-injected strings (campaign names, pitches, recipient names) escaped via `textToSafeHtml` before HTML interpolation.
- CTA URLs constructed from server-known slugs only.
- Per-email unsubscribe link tokenized to the enrollment; clicking it sets `enrollment.status='unsubscribed'` and stops the rest of the schedule for that recipient on that campaign only.

## Verification
- Select donors → `Contact about Fundraiser` → pick a published campaign with `campaign_end_date` 30 days out → review shows "5 emails over 30 days" → enroll → first email arrives immediately, rows in `fundraiser_outreach_sends` show 4 future `scheduled_send_at` values matching the weekly + final-week pattern.
- Pick a campaign ending in 5 days → cadence shows 3 emails (final_week / final_48h / last_chance); first sends immediately as `final_week`.
- Donor places an order on the campaign mid-drip → next dispatcher run marks remaining sends `skipped (donated)` and enrollment `completed`.
- Campaign reaches end date → next dispatcher run marks remaining sends `skipped (campaign_ended)`.
- Recipient with a participant owner: email leads with "{Student} is fundraising for {Team}…" and CTA links to `/c/{slug}/{rosterSlug}`. Without an owner: email frames around the team/group.
- Every email footer contains "Powered by Sponsorly" and a working per-enrollment unsubscribe link.
- Re-enrolling the same donor/campaign updates the existing enrollment instead of creating duplicate sends.
- Suppressed/opt-out donors are filtered at enrollment and never appear in `fundraiser_outreach_sends`.
