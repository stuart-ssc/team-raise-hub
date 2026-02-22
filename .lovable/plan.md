
# Merge Status and Account Columns

## What Changes

Replace the two separate columns ("Status" showing Active/Inactive text, and "Account" showing Signed Up/Invited badges) with a single **"Status"** column that displays a colored pill/badge:

- **Active** (green pill): User has completed signup AND is active
- **Invited** (amber pill): User has not completed signup yet
- **Deactivated** (gray/red pill): User has been deactivated (`active_user = false`)

The priority logic: if the user hasn't completed signup, show "Invited" regardless of active status. If they have completed signup, show "Active" or "Deactivated" based on their `active_user` flag.

## Technical Changes

**`src/pages/Users.tsx`**

1. Update the `AccountStatus` type to `"active" | "invited" | "deactivated"`
2. Update the status determination logic (around line 172) to combine both fields:
   - `!signup_completed` -> `"invited"`
   - `signup_completed && active_user` -> `"active"`
   - `signup_completed && !active_user` -> `"deactivated"`
3. Update `getAccountStatusBadge` to handle the three new statuses with appropriate colors
4. Remove the separate "Status" column from the desktop table header and row (lines 556, 583-586)
5. Remove the separate "Account" column header (line 557) and rename/keep just one "Status" column
6. Update the mobile card view similarly -- remove the Active/Inactive badge (line 475-477) and keep only the merged status badge
7. Update filter options and sort logic to use the new combined status values
8. Update `colSpan` values from 7 to 6 for the loading/empty states
