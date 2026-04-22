

## Goal
Let participants (players, parents, supporters) upload donor lists from the Donors page, automatically attribute each uploaded donor (and any business linked during upload) to the uploading user, and have those donors/businesses show up in their Donors / Businesses views — while remaining visible to org admins and program managers, who can later reassign ownership.

## Current state (so we don't rebuild what exists)
- **Upload UI**: `DonorImportWizard` (CSV → field mapping → preview → import → optional list assignment). Already mounted on `Donors.tsx` for everyone. **Keep as-is** for the UX.
- **Server**: `supabase/functions/import-donors/index.ts` — currently **blocks** non-admins. Needs to allow participants and record attribution.
- **Visibility for participants**: `useParticipantConnections` returns `connectedDonorEmails` derived **only** from `orders.attributed_roster_member_id`. Uploaded donors never have an order, so they're invisible to participants today.

## Database changes

### 1. Add ownership column to `donor_profiles`
```sql
ALTER TABLE public.donor_profiles
  ADD COLUMN added_by_organization_user_id uuid
    REFERENCES public.organization_user(id) ON DELETE SET NULL;

CREATE INDEX idx_donor_profiles_added_by_ou
  ON public.donor_profiles(added_by_organization_user_id);
```
Nullable so existing donors (no original uploader) stay valid. Set on every insert by `import-donors` and by manual "Add donor" flows. **Reassignable** later by an admin.

### 2. Add the same to `business_donors` (link table) and `businesses`
- `business_donors` already has `linked_by uuid` (a `profiles` id). We will additionally populate `linked_by` on every link the import wizard creates. No schema change needed there.
- For `businesses` (when the wizard or a participant creates a *new* business record), add:
```sql
ALTER TABLE public.businesses
  ADD COLUMN added_by_organization_user_id uuid
    REFERENCES public.organization_user(id) ON DELETE SET NULL;
CREATE INDEX idx_businesses_added_by_ou
  ON public.businesses(added_by_organization_user_id);
```

### 3. RLS — keep org admins/managers able to read everything (already true), and let participants read donors/businesses they uploaded
Add SELECT policies so participants can read donor rows where `added_by_organization_user_id` belongs to one of their `organization_user` rows. Existing "Organization members can view donors" policy already covers this for any authenticated user in the same org, so **no new SELECT policy is strictly required** for visibility — the change is purely on the *application-side filter* in `useParticipantConnections` (see below). RLS stays as-is.

### 4. Add `reassign_donor_ownership` SECURITY DEFINER function
```sql
CREATE FUNCTION public.reassign_donor_ownership(
  _donor_id uuid,
  _new_owner_org_user_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ ... $$;
```
Verifies caller is `organization_admin` / `program_manager` of the donor's org and that the new owner belongs to the same org, then updates `added_by_organization_user_id`.

## Edge function: `supabase/functions/import-donors/index.ts`
- **Remove** the hard 403 for non-admins. New rule: caller must be an active member of `organization_id`. All five permission levels can import.
- After auth, look up the caller's matching `organization_user.id` (filter by `organization_id` + `active_user=true` + most-privileged role if multiple).
- For each insert, set `added_by_organization_user_id` to that org_user id. For each update branch (`updateExisting`), only overwrite ownership when current value is `NULL` (so admins editing don't get reassigned to themselves).
- Continue returning `importedDonorIds` so the wizard's existing "add to list" step still works.

## Application changes

### `useParticipantConnections.ts`
Augment what's "connected" for a participant. Two parallel sources, unioned:
1. **Existing**: emails / business_ids from `orders.attributed_roster_member_id ∈ orgUserIds`.
2. **New**: 
   - `donor_profiles.email` where `added_by_organization_user_id ∈ orgUserIds` (for the same `organization_id`).
   - `business_donors.business_id` where `added_by_organization_user_id ∈ orgUserIds` *or* `linked_by = auth.uid()`.
Return the union as `connectedDonorEmails` / `connectedBusinessIds`. No other consumers need to change — `Donors.tsx`, `DonorProfile.tsx`, `Businesses.tsx`, `BusinessProfile.tsx` already filter via these arrays.

### `DonorImportWizard.tsx`
- No UI change required — the wizard already calls `import-donors` with the active org. It will just start succeeding for participants.
- Small copy tweak in step 1 description for participants ("Donors you upload will be added to your supporters and shared with your organization's staff").

### Donors page visibility (`src/pages/Donors.tsx`)
- No filter changes — already keys off `connectedDonorEmails`. Once the hook returns uploaded-donor emails too, they appear automatically.
- Add a small "Added by you" badge on donor rows where `added_by_organization_user_id === organizationUser.id` (purely informational, helps participants recognize their uploads).

### Admin reassignment UI
- In `EditDonorDialog.tsx`, add an "Owner / Added by" select (visible only to org admins + program managers). Lists active org users; default to current value or "Unassigned"; on save calls the `reassign_donor_ownership` RPC. Out of scope: bulk reassignment (can be follow-up).

## Backfill (one-time, optional, runs in same migration)
For donors that have any existing orders attributed via `attributed_roster_member_id`, populate `added_by_organization_user_id` with the earliest such org_user id. This means existing roster-attributed supporters keep showing up for the right participant even after the visibility hook is updated:
```sql
UPDATE public.donor_profiles dp
SET added_by_organization_user_id = sub.org_user_id
FROM ( SELECT DISTINCT ON (o.customer_email, g.organization_id)
         o.customer_email, g.organization_id,
         o.attributed_roster_member_id AS org_user_id
       FROM orders o
       JOIN campaigns c ON c.id = o.campaign_id
       JOIN groups g    ON g.id = c.group_id
       WHERE o.attributed_roster_member_id IS NOT NULL
       ORDER BY o.customer_email, g.organization_id, o.created_at ) sub
WHERE dp.email = sub.customer_email
  AND dp.organization_id = sub.organization_id
  AND dp.added_by_organization_user_id IS NULL;
```

## Out of scope
- Bulk reassignment of donor ownership.
- Changing how `donor_profiles.user_id` is linked at signup (separate concept — that's the donor's own user account, not the uploader).
- Any change to the "donations attributed to participant" calculation — orders still drive fundraising totals.

## Files touched
1. `supabase/migrations/<new>.sql` — add columns, function, backfill.
2. `supabase/functions/import-donors/index.ts` — allow all org members; record `added_by_organization_user_id`.
3. `src/hooks/useParticipantConnections.ts` — union upload-attributed donors/businesses with order-attributed ones.
4. `src/components/DonorImportWizard.tsx` — minor copy tweak (no logic change).
5. `src/pages/Donors.tsx` — "Added by you" badge.
6. `src/components/EditDonorDialog.tsx` — admin/manager-only "Owner" selector calling the new RPC.

## Verification
- A player on `/dashboard/donors` clicks "Upload donors", maps a CSV with 5 emails, imports — wizard reports "5 imported" (no 403).
- The 5 donors immediately appear on the player's Donors page and can be opened.
- An org admin viewing Donors sees the same rows; the EditDonor dialog shows "Added by: <player name>", and admin can reassign to another participant — after refresh, the original uploader no longer sees the row, and the new owner does.
- A parent (`Family Member` linked to a child) sees both donors *they* uploaded and donors the child uploaded.
- An existing donor whose only relationship was a roster-attributed order continues to show for the same player after the backfill.
- Non-org users cannot import (still 401/403).

