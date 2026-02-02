
# Implement Admin Error Alert System

## Overview

Create a system admin email alerting system that notifies you (stuart@schoolsponsorconnect.com) when critical errors occur in edge functions. This will be a reusable pattern that can be added to any edge function.

---

## Architecture

```text
+---------------------------+     +---------------------------+
|   Edge Function           |     |  send-admin-alert         |
|   (e.g., create-stripe-   |---->|  Edge Function            |
|    connect-account)       |     |                           |
+---------------------------+     +---------------------------+
         |                                    |
         | On error, call                     | Sends email via Resend
         | send-admin-alert                   |
         v                                    v
+---------------------------+     +---------------------------+
|   Logs error to console   |     |  stuart@school...         |
|   Returns error to user   |     |  (receives alert)         |
+---------------------------+     +---------------------------+
```

---

## Implementation Steps

### 1. Create New Edge Function: `send-admin-alert`

Create a new edge function that sends email alerts to the system admin when called.

**File:** `supabase/functions/send-admin-alert/index.ts`

**Features:**
- Accepts error details (function name, error message, context data)
- Sends formatted HTML email to admin
- Includes timestamp, error severity level, and actionable information
- Links to relevant Supabase logs for quick debugging

**Email Content:**
- Subject: `[ALERT] Error in {function-name}`
- Body: Error details, timestamp, affected user/organization context
- Link to Edge Function logs in Supabase dashboard

---

### 2. Update Critical Edge Functions to Send Alerts

Integrate the alert system into functions where failures would impact users:

| Function | Error Type to Alert |
|----------|---------------------|
| `create-stripe-connect-account` | Stripe API errors (platform config, account creation) |
| `invite-user` | User creation failures |
| `send-invitation-email` | Email delivery failures |
| `stripe-webhook` | Payment processing errors |
| `create-stripe-checkout` | Checkout session failures |

**Example integration pattern:**

```typescript
// In catch block of edge function
} catch (error) {
  console.error('Error creating Stripe Connect account:', error);
  
  // Send admin alert
  try {
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-alert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify({
        functionName: "create-stripe-connect-account",
        errorMessage: error.message,
        severity: "high",
        context: {
          organizationId,
          groupId,
          entityName
        }
      })
    });
  } catch (alertError) {
    console.error('Failed to send admin alert:', alertError);
  }
  
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

### 3. Alert Email Design

**Subject Line:** `[ALERT] Stripe Connect Error - Tates Creek High School - Softball`

**Email Body:**
- Error severity badge (High/Medium/Low)
- Function name that failed
- Error message
- Timestamp
- Affected entity (organization/group name)
- User context (if available)
- Quick link to view logs in Supabase
- Quick link to relevant admin page

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/send-admin-alert/index.ts` | Create new function |
| `supabase/functions/create-stripe-connect-account/index.ts` | Add alert on Stripe errors |
| `supabase/functions/invite-user/index.ts` | Add alert on user creation errors |
| `supabase/functions/send-invitation-email/index.ts` | Add alert on email failures |

---

## Alert Configuration

The admin email will be configurable via a Supabase secret:

| Secret | Value | Purpose |
|--------|-------|---------|
| `ADMIN_ALERT_EMAIL` | `stuart@schoolsponsorconnect.com` | Recipient for all admin alerts |

This allows changing the alert recipient without code changes.

---

## Optional Future Enhancements

1. **Alert Rate Limiting**: Prevent spam if same error occurs repeatedly
2. **Severity-Based Routing**: Different emails for different severity levels
3. **Slack Integration**: Send alerts to a Slack channel in addition to email
4. **Database Logging**: Store all alerts in a `system_alerts` table for audit trail

---

## Summary

After implementation:
- You'll receive an email whenever a critical error occurs
- Emails include all context needed to quickly diagnose the issue
- Easy to extend to additional edge functions
- No changes required to frontend code
