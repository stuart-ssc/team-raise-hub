## Problem

The Edit Group form actually **does save successfully** to the database — verified directly. For "Sample School / Varsity Basketball", the DB shows `group_type_id` correctly set to "Sports Team" with a recent `updated_at`. The save handler also performs a strict post-write verification that compares returned values against what was sent, so the success toast is trustworthy.

The actual bug is on the **load** side of the dialog: when reopening the form, the saved Group Type appears blank ("Select group type" placeholder), making it look like nothing saved.

## Root Cause

In `src/components/CreateGroupForm.tsx` there are two independent `useEffect` hooks:

1. `loadGroupTypes` (line 76) — populates the `<Select>` options
2. `loadGroupData` (line 112) — fetches the saved row and calls `form.reset({ groupTypeId: ... })`

These run in parallel with no coordination. Radix `<Select>` only displays a value when a matching `<SelectItem>` exists in `<SelectContent>`. If `form.reset` fires before `setGroupTypes` populates the list, the value is set in form state but the trigger renders the placeholder. The user perceives the field as blank.

The Website field shown in the screenshot is genuinely empty in the DB (`website_url: null`) — that's not a bug, the user just hasn't entered one yet.

## Fix

Coordinate the two loads so the form is only reset after group types are available, and re-sync the form value if group types arrive later.

In `src/components/CreateGroupForm.tsx`:

1. Make `loadGroupData` (the editing-load effect) wait until `groupTypes.length > 0` before calling `form.reset`. Add `groupTypes` to its dependency array so it re-runs once the list is populated.
2. As a defensive belt-and-suspenders measure, if the saved `group_type_id` does not exist in the filtered `groupTypes` list (e.g., a school group that was created with a non-school type historically), still set the value in form state and surface a small warning rather than silently dropping it.
3. While `loadingEditData` is true OR `groupTypes` is empty in edit mode, keep showing a subtle loading state on the Group Type field so the user doesn't think it's blank.

No schema changes, no RLS changes, no edge function changes. Pure client-side fix in one file.

## Verification After Fix

- Reopen "Sample School / Varsity Basketball" — Group Type should display "Sports Team".
- Change Group Type, save, reopen — new value should persist and display.
- Confirm Website field still loads correctly when set.
