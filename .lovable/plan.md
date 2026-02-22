

# User Invitation Status and Re-Invite Feature

## Problem
The Users page currently shows all users as "Active" with no distinction between users who have completed signup vs. those who only received an invitation. Admins need to:
1. See at a glance who has signed up vs. who is still just invited
2. Re-send invitations to users who never completed signup
3. Change the email address for invited users (e.g., if the original went to spam or was wrong)

## Current State (Tates Creek Softball)
From the database, many users have never confirmed their email or signed in -- they are "invited but not set up." The current UI shows them all as "Active" which is misleading.

## Solution

### 1. Show Invitation Status on the Users Page

Add a new "Account Status" indicator for each user with three states:
- **Signed Up** (green badge) -- `email_confirmed_at` is set and user has signed in
- **Invited** (yellow/amber badge) -- user exists in auth but has never confirmed or signed in
- **Not Confirmed** (orange badge) -- user confirmed email but never signed in (edge case)

This requires fetching email confirmation and sign-in data from `auth.users`, which is not accessible from the client. A new edge function will look up this data.

### 2. Re-Invite Button

For users whose status is "Invited" (never signed in), show a "Re-send Invite" option in the actions dropdown. This calls the existing `invite-user` edge function which already handles existing users -- it finds them by email, skips creation, and generates a fresh recovery link + invitation email.

### 3. Change Email for Invited Users

For users who are still in "Invited" status, add a "Change Email & Re-invite" option that opens a dialog to enter a new email address. A new edge function will:
- Update the user's email in `auth.users` (using admin API)
- Re-generate the invitation link
- Send the invitation email to the new address

### Changes

**New Files:**
- `supabase/functions/get-user-auth-status/index.ts` -- Edge function that accepts an array of user IDs and returns their `email_confirmed_at` and `last_sign_in_at` from `auth.users` (admin API)
- `supabase/functions/reinvite-user/index.ts` -- Edge function that re-generates an invitation link and re-sends the email, optionally updating the email address first
- `src/components/ReinviteUserDialog.tsx` -- Dialog component for re-inviting with optional email change

**Modified Files:**
- `src/pages/Users.tsx` -- Add account status column, re-invite actions, and integrate the new dialog
- `supabase/config.toml` -- Add `verify_jwt = false` entries for the two new edge functions

### Technical Details

**`get-user-auth-status` edge function:**
- Accepts `{ userIds: string[] }` in the request body
- Uses `supabase.auth.admin.listUsers()` and filters to the requested IDs
- Returns `{ statuses: { [userId]: { emailConfirmed: boolean, lastSignIn: string | null } } }`

**`reinvite-user` edge function:**
- Accepts `{ userId, newEmail?, organizationId, firstName, lastName }`
- If `newEmail` is provided, calls `supabase.auth.admin.updateUserById(userId, { email: newEmail })` to change the email
- Generates a recovery link via `supabase.auth.admin.generateLink({ type: 'recovery', email })`
- Calls the existing `send-invitation-email` function to deliver the email
- Returns success/failure

**`Users.tsx` changes:**
- After fetching users and profiles, call `get-user-auth-status` with all user IDs
- Add `accountStatus` field to the `User` interface: `'signed_up' | 'invited' | 'not_confirmed'`
- Add an "Account Status" column to both the table and mobile card views
- Replace the single "Deactivate" action with a dropdown menu (three dots) containing:
  - "Deactivate" (always available for active users)
  - "Re-send Invite" (only for `invited` status)
  - "Change Email & Re-invite" (only for `invited` status)
- Filter dropdown gains new options: "All", "Active", "Inactive", "Invited", "Signed Up"

**`ReinviteUserDialog.tsx`:**
- Shows current email (read-only) and a field for the new email
- On submit, calls `reinvite-user` edge function
- Shows success/error toast
- Refreshes the user list on success

