

## The mystery of `status` solved

Looked at the code: `status` (boolean) is a **manual on/off toggle** with zero UI to actually toggle it. It defaults to `true` on every campaign and nothing in the app ever flips it to `false`. So "Active/Inactive" is a ghost field — confusing because it doesn't mean what users assume (live, in date range, accepting donations).

Date-based logic is also not currently used for filtering. Campaigns have `start_date` / `end_date` but the filter doesn't check them.

## Proposed filter model (matches your mental model)

Replace the current dropdown with lifecycle-based filters that mean what they say:

| Filter | Logic |
|---|---|
| **All** | Everything except deleted |
| **Active** | `publication_status = 'published'` AND today is between `start_date` and `end_date` (or dates are null) |
| **Published** (all) | `publication_status = 'published'` regardless of dates |
| **Draft** | `publication_status = 'draft'` |
| **Pending Verification** | `publication_status = 'pending_verification'` |
| **Expired** | `publication_status = 'published'` AND `end_date < today` |
| **Deleted** | soft-deleted campaigns (existing) |

Default view: **Active**.

The status badge column will also be updated so an expired published campaign shows "Expired" instead of "Published" — keeps the table truthful.

## What goes away

- "Active" / "Inactive" filter options based on the boolean `status` field
- The `status` boolean is left in the DB (no schema change) but stops being referenced by filter logic. Safe to deprecate later.

## Files to change
- `src/pages/Campaigns.tsx` — filter dropdown options + filter logic + badge rendering for expired

## Out of scope
- Removing the `status` column (separate cleanup)
- Adding manual pause/resume controls (can add later if you want a true on/off)
- Auto-transitioning `publication_status` to `ended` on date expiry (we derive Expired at read-time instead — no cron needed)

