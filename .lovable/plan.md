

# Fix: White Screen When Selecting "Team Player" Role

## Problem
When selecting "Team Player" in the Add Participant form, the page crashes (white screen). This happens because a Radix UI `SelectItem` is rendered with an empty string value (`""`), which Radix does not support.

## Root Cause
In `src/components/AddParticipantForm.tsx` (line 295), when the selected role is NOT "Family Member", a "None" option is rendered in the "Link to Player" dropdown:

```tsx
<SelectItem value="">None</SelectItem>
```

Radix UI requires all `SelectItem` components to have a **non-empty** `value` string. The empty string causes an internal error that crashes the component tree.

## Fix
**File:** `src/components/AddParticipantForm.tsx`

Change the empty value to a sentinel string like `"none"`, and update the form submission logic to treat `"none"` the same as no selection:

1. **Line 295** -- Change `value=""` to `value="none"`
2. **Line 150** -- Update the Family Member validation to also treat `"none"` as empty
3. **Line 169** -- Update the `linkedOrganizationUserId` sent to the edge function to convert `"none"` back to `null`

This is a one-file, three-line fix.
