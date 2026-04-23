

## Goal
Refine the verified-business edit lock so organization users (admins and participant owners) can **fill in missing fields** on a verified business but cannot **change values that already exist**. Once a value is saved, it becomes immutable for non-system-admins. System admins retain full edit ability.

## Behavior

For each editable business detail field on a verified business:

| Existing value | Non-admin can | Non-admin cannot |
|---|---|---|
| `NULL` / empty | Set a value (one-time fill) | — |
| Has a value | — | Change or clear it |

System admins bypass this entirely.

Fields covered (the same set guarded by the existing immutability trigger):
`business_name`, `business_email`, `business_phone`, `website_url`, `ein`, `industry`, `address_line1`, `address_line2`, `city`, `state`, `zip`, `logo_url`.

Tags, archived state, engagement metrics, and contact roster behavior (Disengage/Re-engage) remain unchanged from the prior verified-business plan.

## Database changes

### Replace `enforce_verified_business_immutable` trigger
Update the existing trigger to a "fill-in only" rule for non-system-admins on verified businesses:

For each protected column, raise an exception only when:
- `OLD.<col> IS NOT NULL` AND `OLD.<col> <> ''`, AND
- `NEW.<col> IS DISTINCT FROM OLD.<col>`

If `OLD.<col>` is null/empty, allow the update through (this is the new "fill-in" path).

System admins (`is_system_admin(auth.uid())`) skip the check entirely. Non-verified businesses skip the check entirely.

The error message stays clear: `"Cannot modify field '<col>' on a verified business — value is already set. Contact support to make changes."`

## Frontend changes

### `src/components/EditBusinessDialog.tsx`
- When opened on a **verified** business by a non-system-admin:
  - Replace the current "read-only, Save disabled" banner with an **info banner**: "This business is verified. You can fill in missing details, but existing values can only be changed by Sponsorly support."
  - For each protected field:
    - If the current value is **non-empty** → render the input as **disabled / read-only** with a small lock icon and tooltip "Locked — verified value".
    - If the current value is **empty/null** → render the input as **editable** so the user can fill it in.
  - Keep Save **enabled**. On submit, only send fields that were actually changed (already typical, but make explicit so we don't re-submit locked values and trip the trigger).
- System admins: no field-level locks, full edit (existing behavior).
- Non-verified businesses: no locks, full edit (existing behavior).

### `src/pages/BusinessProfile.tsx`
- The header **Edit** button should now be visible to org admins/participant-owners on verified businesses again (since they can fill in gaps), not just system admins. Update the gate:
  - Show Edit when `canEditBase || isSystemAdmin` (drop the `&& !isVerified` condition for showing the button — the dialog itself enforces field-level locking).
- Verified info banner copy update: "This business is verified. You can add missing details and disengage contacts, but existing values are managed by the business owner."
- **Link Employee** stays gated as before (verified businesses control their own roster — non-admins still can't add new contact links).
- Tag editing: keep available to `canEditBase || isSystemAdmin` (tags were never locked).

### `src/components/BusinessInfoForm.tsx` (checkout flow)
No change — that's for new business creation, unaffected.

## Files touched
- New migration: redefine `enforce_verified_business_immutable` trigger function with the fill-in rule.
- `src/components/EditBusinessDialog.tsx` — per-field lock UI, banner copy, partial submit.
- `src/pages/BusinessProfile.tsx` — re-enable Edit button for owners on verified businesses, update banner copy.

## Verification
- On a verified business with a missing phone number, an org admin or participant owner opens Edit, sees the phone field unlocked and all populated fields locked with a lock icon, fills in the phone, saves successfully, and the new value persists.
- Trying to edit an already-populated field via direct API call as a non-admin returns the trigger error.
- Re-opening Edit after saving the phone shows the phone field now locked (since it has a value).
- System admin opens Edit on the same verified business and sees no locks; can change any field.
- Non-verified businesses behave exactly as before — full edit access for owners/admins.
- Disengage/Re-engage flow on contacts is unaffected.

