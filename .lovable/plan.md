

# Fix Account Status -- Two Bugs Found

## Bug 1: Edge Function Not Deployed
The `identityLastSignIn` field was added to the code but the response still doesn't include it. The TypeScript type annotation on line 64 of the edge function was never updated to include the new field, which may cause it to be stripped. The type must be fixed and the function redeployed.

## Bug 2: Google/OAuth Users Always Show "Invited"
You signed in with **Google OAuth**. The current code searches for an identity with `provider === 'email'`, but your identity has `provider === 'google'`. This means `identityLastSignIn` would always be `null` for you -- even after the fix is deployed.

The same applies to anyone who signs in with Google, Facebook, or Microsoft.

## Solution
Instead of only checking the email identity, check **all** identities and use the most recent `last_sign_in_at` across any provider. If any identity has been used to sign in, the user has completed signup.

### Changes

**`supabase/functions/get-user-auth-status/index.ts`**
- Fix the TypeScript type on line 64 to include `identityLastSignIn`
- Instead of finding only the email identity, find the **most recent** `last_sign_in_at` across all identities (email, google, facebook, azure)
- Return that as `identityLastSignIn`

```text
// Current (broken for OAuth users):
const emailIdentity = user.identities?.find(i => i.provider === "email");
identityLastSignIn = emailIdentity?.last_sign_in_at || null;

// Fixed (works for all auth methods):
const allIdentities = user.identities || [];
const latestSignIn = allIdentities
  .map(i => i.last_sign_in_at)
  .filter(Boolean)
  .sort()
  .pop() || null;
identityLastSignIn = latestSignIn;
```

**`src/pages/Users.tsx`**
- No changes needed -- the existing `if (authStatus?.identityLastSignIn)` check is correct once the API returns the right data

### Why This Works
- Invited users (created via `createUser` + `generateLink`): The `generateLink()` call sets the **user-level** `last_sign_in_at` but does NOT set the **identity-level** `last_sign_in_at`. So all identities will have `null` for this field.
- Users who actually logged in (email/password, Google, etc.): Their identity's `last_sign_in_at` gets set on real authentication.

### Deployment
The edge function must be redeployed after the code change for it to take effect.
