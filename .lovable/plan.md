

# Fix Account Status Detection

## Problem
The `generateLink({ type: 'recovery' })` call in the invite flow causes Supabase to automatically set `email_confirmed_at` and `last_sign_in_at` on the user record. This happens within ~15-20 seconds of user creation, making every invited user appear as "Signed Up" even though they never clicked the link.

## Root Cause
In `invite-user/index.ts` (line 134), when we call `supabase.auth.admin.generateLink({ type: 'recovery', email })`, Supabase confirms the email and records a "sign in" as a side effect. The current status logic in `get-user-auth-status` simply checks if `last_sign_in_at` exists, which is always true after an invite.

## Evidence from Database
- **Fake sign-ins** (invite flow): `seconds_between_create_and_signin` is 15-22 seconds
- **Real sign-ins**: `seconds_between_create_and_signin` is 4,000+ seconds
- **Never-touched users** (createUser succeeded but generateLink didn't run): `last_sign_in_at` is null

## Fix

Update the `get-user-auth-status` edge function to also return `created_at`, then update the status logic in `Users.tsx` to check whether the gap between `created_at` and `last_sign_in_at` is meaningful (more than 60 seconds). If the gap is tiny, it was the invite flow -- not a real login.

### New Status Logic
- **Signed Up** (green): `last_sign_in_at` exists AND the gap from `created_at` is greater than 60 seconds (a real human login)
- **Invited** (amber): Either `last_sign_in_at` is null, OR the gap is less than 60 seconds (only the automated invite flow touched this record)
- **Not Confirmed** (orange): Kept as an edge case but unlikely to occur given the generateLink behavior

### Files to Change

**`supabase/functions/get-user-auth-status/index.ts`**
- Add `created_at` to the returned data for each user (alongside `emailConfirmed`, `lastSignIn`, `email`)

**`src/pages/Users.tsx`**
- Update the status determination logic to compare `lastSignIn` against `createdAt`
- If the difference is less than 60 seconds, treat it as "invited" not "signed_up"

### Technical Detail

```text
Current logic:
  if (lastSignIn)        -> "signed_up"
  else if (emailConfirmed) -> "not_confirmed"  
  else                     -> "invited"

New logic:
  if (lastSignIn AND (lastSignIn - createdAt) > 60 seconds) -> "signed_up"
  else -> "invited"
```
