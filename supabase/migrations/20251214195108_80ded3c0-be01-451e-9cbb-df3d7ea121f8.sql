-- Fix Varsity Basketball group payment configuration
UPDATE groups 
SET payment_processor_config = jsonb_build_object(
  'processor', 'stripe',
  'account_id', 'acct_1SeKf6CiE81U1NzD',
  'account_enabled', true
)
WHERE id = '33333333-3333-3333-3333-333333333333';