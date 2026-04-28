# Signup, Invite & Tracking — Audit + Lock-In Plan

## Honest answer to "Is all of this functionality there?"

**No — about 60% is wired up, but with real gaps. Here's exactly where things stand:**

### ✅ What already exists
- **General signup** (`/signup`) → calls Supabase auth + creates profile.
- **Invite-user edge function** → creates auth user, generates a recovery link, sends a branded Resend email via `send-invitation-email`, and **already calls `send-admin-alert` on errors** (so error→email is partly there).
- **Resend webhook** (`resend-webhook`) → receives Resend events and writes to `email_delivery_log` (which has `sent_at`, `opened_at`, `clicked_at`, `bounced_at` columns). Open/click tracking infrastructure exists.
- **Reinvite flow** (`reinvite-user`, `ReinviteUserDialog`) for re-sending.
- **`get-user-auth-status` edge function** can return `last_sign_in_at` and `email_confirmed_at` for a list of user IDs.
- **Dashboard "Needs Attention" widget** (`src/pages/Dashboard.tsx` lines 696–759) exists and is extensible.

### ❌ What is broken or missing
1. **`signup_attempts` table does NOT exist in the database.** The migration file from the previous session was created but never applied (confirmed via direct DB query). So the abandoned-signup capture you asked for last round is non-functional. The `log-signup-attempt` and `invite-abandoned-signup` edge functions will fail today.
2. **Resend invitation emails are not linked to `email_delivery_log`.** `send-invitation-email` does not write a row with `email_type='invitation'` and the Resend `email_id`, so the webhook has nothing to update — meaning **we cannot currently see if an invitee opened the email or clicked the link.**
3. **No bulk roster CSV upload exists.** Coaches add participants one-at-a-time via `AddParticipantForm`. There is no "upload roster + send invites now/later" flow at all.
4. **Roster table does not show signup status.** `Rosters.tsx` shows Active/Inactive but never displays whether the user has accepted the invite, confirmed their email, or last logged in.
5. **"Needs Attention" widget does not surface invite-related items.** No "X players haven't accepted their invite" or "Y players haven't logged in in 30 days" entries.
6. **General signup errors do NOT email admins.** `Signup.tsx` only shows a toast — `send-admin-alert` is never called from the signup path.
7. **Resend webhook setup is manual.** Need to confirm the webhook is actually configured in the Resend dashboard pointing at `resend-webhook`, otherwise no open/click data flows in regardless of code.

---

## The Plan

### 1. Apply the missing `signup_attempts` migration
Re-run the migration (it's already in the repo but un-applied). Verify the table, RLS, and the `mark_signup_attempt_completed` trigger exist.

### 2. Wire admin error alerts into the public signup flow
In `src/pages/Signup.tsx`, when `supabase.auth.signUp` returns an error or throws, also invoke `send-admin-alert` (severity: high) with the email, name, error message, and user-agent. You'll get an email at stuart@sponsorly.io within seconds of any signup failure.

### 3. Make invitation emails fully trackable
- **`send-invitation-email`**: before sending, insert a `email_delivery_log` row with `email_type='invitation'`, recipient, and metadata (organization, group, invited_user_id, invited_by). After Resend responds, update the row with `resend_email_id` + `sent_at`. On error, set `status='failed'` + `error_message` and trigger admin alert (already there).
- **`resend-webhook`**: confirm it updates rows by `resend_email_id`. If the webhook isn't installed in Resend, output the URL and required events (`email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`) so you can paste it into Resend in 30 seconds.
- **`signup_attempts`**: when `invite-user` runs, also insert/update a `signup_attempts` row with `invite_sent_at` and `invite_sent_by` so we have a single timeline per email.

### 4. Bulk roster CSV upload + "send invites now or later"
New component `BulkRosterUpload.tsx` triggered from `Rosters.tsx` (button next to "Add Participant"):
- Drop a CSV with columns: `first_name, last_name, email, role` (role optional, defaults to "Team Player" / "Club Participant").
- Preview parsed rows with validation (duplicate emails on this roster get flagged, bad emails get flagged).
- Confirm dialog asks: **"Send invitation emails now?"** with three options:
  - **Send now to everyone**
  - **Save roster, send later** (creates `organization_user` rows with `active_user=true` but skips the invite call — a "Send Invites" bulk button on the roster page handles it later)
  - **Cancel**
- Backend: new edge function `bulk-invite-roster` that loops through rows, calls the existing invite-user logic per email, and returns per-row success/error so the UI can show a result summary.

### 5. Roster page shows signup status per participant
Extend `Rosters.tsx` table with new columns:

```text
Name | Role | Account Status | Last Login | Status | Action
                ^^^^^^^^^^^^   ^^^^^^^^^^
                Invited /      "Never" or
                Email opened / "3 days ago"
                Link clicked /
                Account created
```

Implementation:
- After loading the roster, call `get-user-auth-status` (already exists) for the user IDs to get `email_confirmed_at`, `last_sign_in_at`, `created_at`.
- Query `email_delivery_log` for the most recent `email_type='invitation'` row per recipient_email to get `sent_at`, `opened_at`, `clicked_at`.
- Derive `Account Status`: `Account created` (has `last_sign_in_at` or `email_confirmed_at`) > `Link clicked` > `Email opened` > `Email sent` > `No invite sent`.
- Add a per-row "Resend invite" link for anyone stuck below "Account created".

### 6. Surface invite gaps in the "Needs Attention" widget
In `Dashboard.tsx`, add two new attention items (only for users with `canManageUsers`):
- **"X roster members haven't accepted their invite"** → links to `/dashboard/rosters?filter=pending_invite`
- **"X members haven't logged in in 30+ days"** → links to `/dashboard/rosters?filter=stale`
Both computed from the same data sources used in step 5, scoped to the active group.

---

## Technical Details

**New / changed files**
- `supabase/migrations/<new>.sql` — re-apply signup_attempts; add `email_delivery_log.invited_user_id uuid` (nullable) for direct linking; add index on `(email_type, recipient_email, sent_at desc)`.
- `supabase/functions/bulk-invite-roster/index.ts` — new.
- `supabase/functions/send-invitation-email/index.ts` — write `email_delivery_log` row + capture `resend_email_id`.
- `supabase/functions/invite-user/index.ts` — also upsert `signup_attempts` row with `invite_sent_at`.
- `supabase/functions/resend-webhook/index.ts` — confirm/expand `invitation` event handling.
- `src/pages/Signup.tsx` — call `send-admin-alert` on auth errors.
- `src/pages/Rosters.tsx` — new "Bulk Upload" button, new columns, status-based filter.
- `src/components/BulkRosterUpload.tsx` — new CSV upload + "send now / later" dialog.
- `src/pages/Dashboard.tsx` — two new attention items + queries.

**External setup you need to do (one-time, ~2 min)**
After deploy, I'll print the exact Resend webhook URL + the events to enable. Without this, opens/clicks won't flow even with perfect code.

**Out of scope (flag if you want them too)**
- SMS invites
- Tracking who opened the *invite acceptance page* itself (vs the email) — would need a server-side hit on `/set-password?token=…`
- Auto-reminder emails to invitees after N days of no acceptance (could add as a cron later)
