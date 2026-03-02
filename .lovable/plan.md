
# Fix: Link Orders to Logged-In Users

## Problem
The "My Orders" page queries `orders` where `user_id = auth.uid()`, but no order ever gets a `user_id` set. The `create-stripe-checkout` function creates orders without checking if the user is authenticated, so `user_id` is always `null`.

## Solution

### 1. Update `create-stripe-checkout` to capture `user_id`
When creating the order, check if the request includes a valid auth token. If the user is logged in, set `user_id` on the order record. The function already receives the `Authorization` header and creates a Supabase client with it -- we just need to call `getUser()` and pass the ID to the insert.

**Change in `supabase/functions/create-stripe-checkout/index.ts`:**
- After creating the supabase client (line 17-21), call `supabaseClient.auth.getUser()` to get the current user (if any)
- Add `user_id: user?.id || null` to the order insert at line 202

### 2. Update `verify-checkout-session` to also set `user_id`
When the verify function fulfills a pending order, it should also try to link the user. Since verify is called from the success page (which may have auth), extract the user from the auth header.

### 3. Update `stripe-webhook` to link by email
When the webhook fulfills an order, look up the user by `customer_email` in `auth.users` and set `user_id` if found. This handles the case where the webhook fires before the success page.

### 4. Fix Stuart's existing order (one-time data fix)
Update the existing order to link it to Stuart's user account (`aa5ac4e9-3e2e-43e3-aac9-e962b0b7bd1c`).

### 5. Backfill existing orders
Run a one-time query to link any other unlinked orders to users by matching `customer_email` to `auth.users.email`.

## Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/create-stripe-checkout/index.ts` | Add `getUser()` call, pass `user_id` to order insert |
| `supabase/functions/verify-checkout-session/index.ts` | Set `user_id` when fulfilling order |
| `supabase/functions/stripe-webhook/index.ts` | Set `user_id` by email lookup when fulfilling order |
| Database migration | Backfill existing orders with user IDs by email match |

## Technical Details

In `create-stripe-checkout`, the change is minimal:
```typescript
// After line 21, add:
const { data: { user } } = await supabaseClient.auth.getUser();

// In the order insert (line 202), add:
user_id: user?.id || null,
```

The backfill migration:
```sql
UPDATE orders o
SET user_id = u.id
FROM auth.users u
WHERE LOWER(o.customer_email) = LOWER(u.email)
AND o.user_id IS NULL;
```
