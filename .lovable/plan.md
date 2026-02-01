

## Clear Test Stripe Data from Database

### Summary
Execute a database migration to remove all test Stripe data, preparing the system for production use with your first real team.

---

### Data to be Cleaned

| Table | Records Found | Action |
|-------|---------------|--------|
| `stripe_connect_accounts` | 4 test accounts | Delete all |
| `organizations` | ~20 with payment config | Reset to NULL |
| `groups` | 10 with payment config (1 has active test account) | Reset to NULL |
| `orders` | 7 orders (2 succeeded, 5 pending) | Archive as `test_archived` |
| `stripe_payouts` | 0 records | No action needed |
| `subscriptions` | 0 records | No action needed |

---

### Migration SQL

```sql
-- Step 1: Delete all test Stripe Connect accounts
DELETE FROM stripe_connect_accounts;

-- Step 2: Reset payment processor config on all organizations
UPDATE organizations 
SET payment_processor_config = NULL
WHERE payment_processor_config IS NOT NULL;

-- Step 3: Reset payment processor config on all groups
UPDATE groups 
SET payment_processor_config = NULL
WHERE payment_processor_config IS NOT NULL;

-- Step 4: Archive all existing orders as test data
UPDATE orders 
SET status = 'test_archived'
WHERE status IN ('pending', 'succeeded', 'completed');
```

---

### Expected Results

After running this migration:

1. **Stripe Connect Accounts**: Empty table, ready for production accounts
2. **Organizations**: All `payment_processor_config` reset to NULL
3. **Groups**: All `payment_processor_config` reset to NULL  
4. **Orders**: All existing orders marked as `test_archived` (preserved for reference)

---

### Next Steps After Migration

1. Navigate to **Organization Settings → Payment Setup**
2. Click **"Connect with Stripe"** to start production onboarding
3. Complete Stripe Express verification
4. Publish a campaign and process a small real transaction to verify

