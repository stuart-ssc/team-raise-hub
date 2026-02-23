

# Fix: Parent Invitation Email Not Sending (Wrong Sender Domain)

## Problem

The parent invitation email is failing with a 403 error from Resend because the `from` address uses `noreply@sponsorly.app`, but only `sponsorly.io` is verified in Resend.

Error from logs:
```
"The sponsorly.app domain is not verified"
```

## Fix

One-line change in `supabase/functions/send-parent-invitation/index.ts`:

Change line ~179:
```
from: "Sponsorly <noreply@sponsorly.app>"
```
to:
```
from: "Sponsorly <noreply@sponsorly.io>"
```

This matches the verified domain used by all other email-sending edge functions in the project.

## After Deploying

Kate will need to re-send the invitation from her dashboard (or you can delete the pending invitation and have her create a new one). The existing invitation record is still valid -- the token was created, just the email wasn't delivered.

## File to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-parent-invitation/index.ts` | Change sender from `noreply@sponsorly.app` to `noreply@sponsorly.io` |

