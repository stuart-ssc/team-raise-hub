
# Fix: Update Invitation Email Sender to Use Verified Domain

## Current Issue

The invitation email is failing because it uses the default Resend test domain:
```typescript
from: "Sponsorly <onboarding@resend.dev>",
```

Resend restricts `onboarding@resend.dev` to only send to the account owner's email address.

---

## Solution

Update the `from` address to use your verified `sponsorly.io` domain.

---

## Changes Required

**File: `supabase/functions/send-invitation-email/index.ts`**

**Line 32** - Change the sender address:

```typescript
// Before
from: "Sponsorly <onboarding@resend.dev>",

// After
from: "Sponsorly <noreply@sponsorly.io>",
```

---

## Complete Change

The only change needed is on line 32:

| Line | Before | After |
|------|--------|-------|
| 32 | `from: "Sponsorly <onboarding@resend.dev>",` | `from: "Sponsorly <noreply@sponsorly.io>",` |

---

## Files to Modify

- `supabase/functions/send-invitation-email/index.ts` (line 32)

---

## After Deployment

1. The edge function will auto-deploy with the updated sender
2. Delete the existing test user if needed:
   ```sql
   DELETE FROM organization_user WHERE user_id = 'aa5ac4e9-3e2e-43e3-aac9-e962b0b7bd1c';
   DELETE FROM profiles WHERE id = 'aa5ac4e9-3e2e-43e3-aac9-e962b0b7bd1c';
   ```
   Then in Supabase Dashboard > Authentication > Users, delete the user `stuartborders@gmail.com`
3. Re-invite `stuartborders@gmail.com` - the email should now send successfully
