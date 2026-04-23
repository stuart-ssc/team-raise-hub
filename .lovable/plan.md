

## Goal
Adjust the participant business ownership plan so participants can **hide (archive)** businesses they own but **never delete** them. Business records must be preserved for Sponsorly to upsell to. Admins/managers also lose hard-delete capability on businesses going forward — archive only.

## Changes

### Database (RLS)
- **Do NOT** add a `DELETE` policy on `businesses` for participants.
- Review and **remove any existing `DELETE` policy** on `businesses` that allows org admins/managers to hard-delete. Replace destructive flows with archive.
- Keep planned `INSERT` and `UPDATE` policies for participant owners (so they can create and edit/archive their own businesses).
- `UPDATE` policy must allow toggling the archive field (`is_archived` / `archived_at`) — no separate delete path.

### `src/components/AddBusinessDialog.tsx`
- Set `added_by_organization_user_id: organizationUser.id` on insert (unchanged from prior plan).

### `src/pages/Businesses.tsx`
- Participant per-card Actions dropdown: show **Edit**, **Add Tags**, **Send Email**, **Archive** / **Restore**. **Remove "Delete"** entirely from the participant menu.
- Admin/manager Actions dropdown and `BulkActionToolbarBusiness`: **remove the "Delete" button** for everyone. Bulk action keeps Archive / Restore / Export / Tag / Email / Enroll / Verify.
- Update `BulkActionToolbarBusiness.tsx` to drop the `onDelete` prop and the Trash button.
- Show "Added by you" badge on participant-owned cards.

### `src/pages/BusinessProfile.tsx`
- Permission gate: `const canEdit = canManageBusinesses || (isParticipantView && ownsBusiness);`
- Show Edit, Archive/Restore, Link Employee, Save Notes, Add Tags when `canEdit`.
- **Remove the Delete button** from this page for all roles (admin and participant).
- Keep Verify and campaign enrollment management admin-only.

### Copy
- Replace any "Delete business" microcopy with "Archive business". Archive confirmation: "Archiving hides this business from your list. The record is preserved and can be restored later."

## Files touched
- New migration in `supabase/migrations/` — add participant INSERT/UPDATE policies on `businesses`, `organization_businesses`, `business_donors`; backfill ownership; add `reassign_business_ownership` function; drop any existing DELETE policies on `businesses`.
- `src/components/AddBusinessDialog.tsx`
- `src/components/BulkActionToolbarBusiness.tsx`
- `src/pages/Businesses.tsx`
- `src/pages/BusinessProfile.tsx`

## Verification
- Participant can create a business, edit it, archive it, and restore it from `/dashboard/businesses` and `/dashboard/businesses/:id`.
- No "Delete" button appears anywhere on the businesses UI for any role.
- Bulk toolbar offers Archive/Restore but not Delete.
- Attempting a `DELETE` on `businesses` via the API is rejected by RLS for non-system-admin roles.
- Archived businesses are hidden from default views but remain in the database, queryable by system admins.

