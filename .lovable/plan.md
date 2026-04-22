

## Problem
Taylor saved a phone number on a donor she owns. She got a "Success" toast, but the value did not persist. Database confirms `phone` is still NULL and `updated_at` did not change.

## Root cause
Two issues, one a real bug, one a UX bug:

1. **RLS blocks the update silently.** The current UPDATE policy on `donor_profiles` (`Authorized users can update donors`) only allows `organization_admin` or `program_manager`. Participants (players, parents, etc.) — even when they are the donor's owner (`added_by_organization_user_id` = their `organization_user.id`) — cannot update the row. Supabase `.update()` with RLS returns `0 rows, no error`, so the client thinks it succeeded.
2. **Client treats "0 rows updated" as success.** `EditDonorDialog.handleSave` does not check `count`, so it always toasts "Success" even when nothing was written.

## Fix

### 1. Database — allow donor owners to update their own donors
Add a new RLS policy on `public.donor_profiles` for UPDATE:

```sql
CREATE POLICY "Donor owners can update their donors"
ON public.donor_profiles
FOR UPDATE
TO authenticated
USING (
  added_by_organization_user_id IN (
    SELECT id FROM public.organization_user
    WHERE user_id = auth.uid()
      AND organization_id = donor_profiles.organization_id
      AND active_user = true
  )
)
WITH CHECK (
  added_by_organization_user_id IN (
    SELECT id FROM public.organization_user
    WHERE user_id = auth.uid()
      AND organization_id = donor_profiles.organization_id
      AND active_user = true
  )
);
```

This is additive — existing admin/manager and self-edit policies remain. A participant can only edit donors they themselves added.

Note: this does **not** allow ownership reassignment (still blocked by the existing `reassign_donor_ownership` RPC permission check). The dialog already hides that select for non-managers.

### 2. Client — surface silent failures
In `src/components/EditDonorDialog.tsx`:
- Change the update call to request the affected rows count:
  ```ts
  const { data, error, count } = await supabase
    .from("donor_profiles")
    .update(updatePayload, { count: "exact" })
    .eq("id", donor.id)
    .select("id");
  ```
- If `error` → existing error toast.
- Else if `!data || data.length === 0` → toast `"You don't have permission to edit this donor"` (destructive) and return without firing the success path. This prevents future silent-success regressions on any RLS-restricted row.

### 3. Optional polish (same file)
Hide the "Edit Contact" button on the donor profile when the viewer has neither manager-level permission nor ownership of the donor, so non-owners (e.g., a teammate viewing another player's donor) don't see a button that would also fail. Logic in `src/pages/DonorProfile.tsx`:
```ts
const canEditDonor =
  canManageOwnership ||
  donor?.added_by_organization_user_id === organizationUser?.id;
```
Render the button only when `canEditDonor` is true.

## Files touched
- New migration adding the RLS policy above.
- `src/components/EditDonorDialog.tsx` — verify row count, show real failure toast.
- `src/pages/DonorProfile.tsx` — gate the "Edit Contact" button on `canEditDonor`.

## Verification
- As Taylor, edit Donor Five, add phone `270-123-4324`, save → toast "Donor information updated successfully", the Contact card on the profile immediately shows the new phone, and `donor_profiles.phone` in the database is set.
- As Taylor, attempt to edit a donor she does not own (via direct API call) → RLS still blocks; the new UI guard hides the button anyway.
- As an org admin, edit any donor → still works exactly as before.
- A donor user (with `user_id`) editing their own profile elsewhere → unaffected (separate self-edit policy).
- Email field remains locked when `donor.user_id` is set (prior change preserved).

