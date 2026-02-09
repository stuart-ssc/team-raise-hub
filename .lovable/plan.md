

# Recover Stuck Orders and Harden Webhook System

## Current Situation

Two orders are stuck in `pending` status despite successful Stripe payments:

| Order ID | Customer | Amount | Payment Intent |
|----------|----------|--------|----------------|
| `481dd3eb-...` | Stuart Borders (stuartborders@gmail.com) | $6.00 | `pi_3SywerEOAGwz3vRr0qCh0pLa` |
| `8d5e48b0-...` | Chris Skiles (chris@absdabs.com) | $6.00 | `pi_3SywnlEOAGwz3vRr0bOoDu0R` |

The `stripe-webhook` function receives some events (`account.external_account.updated`) but NOT checkout/payment events. This points to a Stripe Dashboard webhook configuration issue -- likely the checkout events are assigned to a different or misconfigured webhook endpoint.

## Plan

### 1. Recover Both Stuck Orders (Database Update)

Use the Supabase insert tool to update both orders to `succeeded` status with their payment intent IDs. This will trigger the existing `update_donor_profile_from_order` database function, which automatically:
- Creates/updates donor profiles for both customers
- Logs donation activity
- Updates campaign fundraising totals

### 2. Harden the Stripe Webhook Function

Update `supabase/functions/stripe-webhook/index.ts` with:

- **Early request logging** at the very top (before signature verification) so we can distinguish "webhook never called" from "webhook called but errored"
- **Admin alert on signature failure** via `send-admin-alert` so you get notified immediately of configuration issues
- **Request method/headers logging** to help debug delivery problems

### 3. Create Order Recovery Tool in System Admin

New page `src/pages/SystemAdmin/OrderRecovery.tsx` that allows:
- Searching orders by ID, email, or campaign name
- Viewing order details (status, amount, customer, timestamps, Stripe IDs)
- Manually marking pending orders as `succeeded` when webhooks fail
- This prevents needing developer intervention for future stuck orders

### 4. Add Navigation

- Add "Order Recovery" link to `src/components/SystemAdminSidebar.tsx`
- Add route to `src/App.tsx` under system admin routes

## Technical Details

### Database Update (both orders)

```sql
UPDATE orders SET status = 'succeeded', stripe_payment_intent_id = 'pi_3SywerEOAGwz3vRr0qCh0pLa', updated_at = now()
WHERE id = '481dd3eb-b831-461c-8bca-16a87070ef99' AND status = 'pending';

UPDATE orders SET status = 'succeeded', stripe_payment_intent_id = 'pi_3SywnlEOAGwz3vRr0bOoDu0R', updated_at = now()
WHERE id = '8d5e48b0-5c73-40a3-8556-761cf094fe70' AND status = 'pending';
```

### Webhook Logging Enhancement

Add at the very start of the handler (before signature verification):

```typescript
console.log('Stripe webhook received:', req.method, req.url, new Date().toISOString());
console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
```

Add admin alert in signature failure catch block:

```typescript
await supabaseAdmin.functions.invoke('send-admin-alert', {
  body: {
    functionName: 'stripe-webhook',
    errorMessage: `Signature verification failed: ${err.message}`,
    severity: 'high',
    context: { timestamp: new Date().toISOString() }
  }
});
```

### Order Recovery Page

Simple admin tool with:
- Search input (by order ID, customer email, or campaign)
- Results table showing order details and status
- "Mark as Succeeded" button per order
- Confirmation dialog before status change
- Only accessible to system admins (wrapped in SystemAdminGuard)

### Files Modified/Created

| File | Change |
|------|--------|
| Database (insert tool) | Update 2 stuck orders to succeeded |
| `supabase/functions/stripe-webhook/index.ts` | Add early logging + admin alerts |
| `src/pages/SystemAdmin/OrderRecovery.tsx` | New order recovery admin tool |
| `src/App.tsx` | Add OrderRecovery route |
| `src/components/SystemAdminSidebar.tsx` | Add nav link |

### Important Note

The webhook configuration issue in Stripe Dashboard needs to be fixed separately. Please verify that the webhook endpoint `https://tfrebmhionpuowpzedvz.supabase.co/functions/v1/stripe-webhook` is configured to receive `checkout.session.completed` and `payment_intent.succeeded` events. If you have multiple webhooks, the checkout events may be on a different endpoint.

