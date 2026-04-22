
## Goal
Add an "Edit Contact" button to the donor profile page header that opens the existing `EditDonorDialog`. Make the email field read-only inside that dialog when the donor record is already linked to a real authenticated user account.

## Changes

### 1. `src/pages/DonorProfile.tsx`
- Add `user_id: string | null` to the local `DonorProfile` interface and select it from `donor_profiles` (already done via `select("*")`).
- Add state `const [showEditDialog, setShowEditDialog] = useState(false)`.
- In the header row (next to the donor name/badge), add a right-aligned **"Edit Contact"** button (outline variant, `Edit` icon already imported) that sets `showEditDialog(true)`.
- Render `<EditDonorDialog />` at the bottom of the page, passing `donor` (mapped to the dialog's expected shape) and an `onComplete` callback that re-runs `fetchDonorData()` to refresh the profile in place.
- Import `EditDonorDialog` from `@/components/EditDonorDialog`.

### 2. `src/components/EditDonorDialog.tsx`
- Extend the `donor` prop interface with `user_id?: string | null`.
- Compute `const emailLocked = !!donor?.user_id`.
- When `emailLocked`:
  - Render the email `Input` as `disabled` with a small helper line below: *"This email is verified with a Sponsorly account and cannot be changed here."*
  - In `handleSave`, omit the `email` field from the update payload so a locked email is never sent.
- When not locked, behavior is unchanged (still required, still validated).

## Visual result
```text
Donor Name                                [Edit Contact]
• Low Engagement •
```
Inside the dialog, if linked to an account:
```
Email *  [john@example.com    ] (disabled, greyed)
This email is verified with a Sponsorly account and cannot be changed here.
```

## Files touched
- `src/pages/DonorProfile.tsx`
- `src/components/EditDonorDialog.tsx`

## Verification
- On `/dashboard/donors/:id`, an "Edit Contact" button appears in the header (admins, managers, and owners — anyone who can view the page).
- Clicking it opens the existing edit dialog pre-filled with current values.
- For donors with no `user_id`: email is editable; saving updates all fields and the profile refreshes.
- For donors whose `user_id` is set (linked to an auth user): email field is disabled with the explanatory note; all other fields remain editable; save still works and email stays unchanged.
- Owner reassignment select still appears only for org admins / program managers (existing logic preserved).
- No RLS or schema changes required — `donor_profiles.user_id` already exists and updates already work via existing RLS.
