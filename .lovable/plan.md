

## Goal
Update the verified-business info banner copy in the Edit Business dialog to clarify that existing values can be changed by **the business owner or Sponsorly support** (not Sponsorly support alone).

## Changes

### `src/components/EditBusinessDialog.tsx`
Update the `<Alert>` description text shown when `isVerified && !isSystemAdmin`:

- **From:** "This business is verified. You can fill in missing details, but existing values can only be changed by Sponsorly support."
- **To:** "This business is verified. You can fill in missing details, but existing values can only be changed by the business owner or Sponsorly support."

Also update the matching `LockedLabel` tooltip copy for consistency:
- **From:** "Locked — verified value. Contact support to change."
- **To:** "Locked — verified value. Contact the business owner or Sponsorly support to change."

## Files touched
- `src/components/EditBusinessDialog.tsx`

## Verification
- Opening the Edit dialog on a verified business as a non-system-admin shows the updated banner copy mentioning both the business owner and Sponsorly support.
- Hovering the lock icon next to a locked field shows the matching updated tooltip.
- No other behavior changes.

