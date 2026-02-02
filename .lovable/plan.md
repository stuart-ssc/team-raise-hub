
# Continue: Admin Error Alert System Implementation

## Secret Required

Before I can create the edge function, please add this secret:

| Secret Name | Value |
|-------------|-------|
| `ADMIN_ALERT_EMAIL` | `stuart@schoolsponsorconnect.com` |

This is where all admin error alerts will be sent.

---

## Implementation Steps (After Secret is Added)

### Step 1: Create `send-admin-alert` Edge Function

**File:** `supabase/functions/send-admin-alert/index.ts`

A new edge function that:
- Accepts error details (function name, error message, severity, context)
- Sends formatted HTML email via Resend
- Includes timestamp, Supabase logs link, and actionable context

### Step 2: Update `supabase/config.toml`

Add configuration for the new function:
```toml
[functions.send-admin-alert]
verify_jwt = false
```

### Step 3: Integrate Alerts into Critical Edge Functions

**Files to modify:**

1. **`supabase/functions/create-stripe-connect-account/index.ts`**
   - Add alert call in catch block for Stripe API errors

2. **`supabase/functions/invite-user/index.ts`**
   - Add alert call for user creation failures

3. **`supabase/functions/send-invitation-email/index.ts`**
   - Add alert call for email delivery failures

**Integration pattern for each function:**
```typescript
// In catch block
try {
  await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-alert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
    },
    body: JSON.stringify({
      functionName: "function-name-here",
      errorMessage: error.message,
      severity: "high",
      context: { /* relevant context */ }
    })
  });
} catch (alertError) {
  console.error('Failed to send admin alert:', alertError);
}
```

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/send-admin-alert/index.ts` | Create new |
| `supabase/config.toml` | Add function config |
| `supabase/functions/create-stripe-connect-account/index.ts` | Add alert integration |
| `supabase/functions/invite-user/index.ts` | Add alert integration |
| `supabase/functions/send-invitation-email/index.ts` | Add alert integration |

---

## Next Action

Click **Approve** to proceed. I will:
1. Prompt you to add the `ADMIN_ALERT_EMAIL` secret
2. Create the `send-admin-alert` edge function
3. Integrate alerts into the three critical edge functions
