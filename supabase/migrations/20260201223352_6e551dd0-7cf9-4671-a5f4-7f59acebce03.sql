-- Clear Test Stripe Data Migration
-- Reorder operations to avoid trigger issues: archive orders first, then clear configs

-- Step 1: Archive all existing orders as test data FIRST (before clearing payment configs)
UPDATE orders 
SET status = 'test_archived'
WHERE status IN ('pending', 'succeeded', 'completed');

-- Step 2: Delete all test Stripe Connect accounts
DELETE FROM stripe_connect_accounts;

-- Step 3: Reset payment processor config on all organizations
UPDATE organizations 
SET payment_processor_config = NULL
WHERE payment_processor_config IS NOT NULL;

-- Step 4: Reset payment processor config on all groups
UPDATE groups 
SET payment_processor_config = NULL
WHERE payment_processor_config IS NOT NULL;