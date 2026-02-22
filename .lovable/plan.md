

# Stop Guessing -- Track Signup Status Directly

## The Real Problem

Every attempt so far has tried to infer "invited vs signed up" from Supabase Auth internals (`last_sign_in_at`, `identities`, timestamp gaps). These keep failing because:

- `generateLink()` silently sets `last_sign_in_at`
- Identity-level `last_sign_in_at` behaves differently for OAuth vs email
- The Supabase Admin API doesn't expose password existence
- We have no control over what Supabase sets internally

**We need to stop relying on Supabase's internal auth state and track this ourselves.**

## Solution

Add a `signup_completed` column to the `profiles` table. It starts as `false` when a user is created via invite, and gets set to `true` only when the user actually logs in for the first time.

### How It Works

1. **Invited users**: The `invite-user` edge function creates the auth user and triggers `handle_new_user`, which creates a profile with `signup_completed = false` (the default)
2. **User completes signup**: When a user logs in for the first time (email/password, Google, Facebook, anything), the app sets `signup_completed = true` on their profile
3. **Self-registered users**: Users who sign up directly through the signup page will have `signup_completed = true` set immediately after account creation
4. **Status display**: The Users page simply reads `signup_completed` from the profile -- no edge function needed, no guessing

### Changes

**Database Migration**
- Add `signup_completed` boolean column to `profiles` table, default `false`
- Set it to `true` for all existing users who have genuinely logged in (we can use the identity-level data one final time to backfill, or just set everyone who created their own account to `true`)

**`src/hooks/useAuth.ts` (or wherever auth state is managed)**
- After successful login (any method), update `profiles.signup_completed = true` for the current user
- This runs once per user and is a simple upsert

**`src/pages/Signup.tsx`**
- After successful self-registration, set `signup_completed = true`

**`src/pages/Users.tsx`**
- Remove the edge function call to `get-user-auth-status` for determining account status
- Read `signup_completed` directly from the profiles query that already exists
- If `signup_completed = true`: show "Active" (green)
- If `signup_completed = false`: show "Invited" (amber)

**`supabase/functions/get-user-auth-status/index.ts`**
- Keep this function for fetching email addresses (still needed for the Users table), but stop using it for status determination

### Technical Details

```text
Database:
  ALTER TABLE profiles ADD COLUMN signup_completed boolean NOT NULL DEFAULT false;

  -- Backfill: mark existing users who signed up themselves as completed
  -- (users whose profile created_at matches their auth created_at closely
  --  AND who have actually used the app)
  UPDATE profiles SET signup_completed = true WHERE id IN (
    SELECT id FROM profiles WHERE updated_at != created_at
  );

Auth hook (runs on every login):
  supabase.from('profiles')
    .update({ signup_completed: true })
    .eq('id', user.id)
    .eq('signup_completed', false);  // only updates once

Users page:
  // Old: call edge function, parse auth metadata, guess
  // New: 
  accountStatus = profile.signup_completed ? "signed_up" : "invited"
```

### Why This Actually Works

- It doesn't depend on any Supabase Auth internal behavior
- It works identically for email, Google, Facebook, Microsoft, or any future auth provider
- It's a simple boolean -- no timestamp math, no identity inspection, no heuristics
- Once set to `true`, it stays `true` forever
- The status is stored in our own database, under our control
