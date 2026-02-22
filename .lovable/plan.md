

# Fix Account Status Using Identity-Level Sign-In

## Problem
The user-level `last_sign_in_at` gets set by `generateLink()` during the invite flow, making the timestamp heuristic unreliable. Supabase also doesn't expose a "has_password" flag via the Admin API.

## Solution
Use the **identity-level** `last_sign_in_at` instead. Each user in Supabase has an `identities` array. The email identity's `last_sign_in_at` is only set when the user actually authenticates with email + password -- not by admin API calls like `generateLink()`.

### New Status Logic

- **Signed Up** (green): The user's email identity has a non-null `last_sign_in_at` (they've actually logged in with a password)
- **Invited** (amber): The email identity has no `last_sign_in_at`, meaning they were created via invite but never completed signup

### Changes

**`supabase/functions/get-user-auth-status/index.ts`**
- Read `user.identities` array from the admin API response
- Find the identity with `provider === 'email'`
- Return `identityLastSignIn: identity.last_sign_in_at` instead of (or alongside) the user-level `lastSignIn`

**`src/pages/Users.tsx`**
- Simplify the status logic: if `identityLastSignIn` exists, the user is "signed_up"; otherwise "invited"
- Remove the 60-second gap heuristic

### Technical Detail

The Supabase user object from `listUsers()` includes:
```
user.identities = [
  {
    provider: "email",
    last_sign_in_at: "2025-01-15T..." // only set on real auth
    ...
  }
]
```

```text
New logic:
  emailIdentity = user.identities.find(i => i.provider === 'email')
  if (emailIdentity?.last_sign_in_at) -> "signed_up"
  else -> "invited"
```

This is simpler and more reliable than any timestamp comparison.
