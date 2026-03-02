-- Backfill existing orders: link user_id by matching customer_email to auth.users.email
UPDATE public.orders o
SET user_id = u.id
FROM auth.users u
WHERE LOWER(o.customer_email) = LOWER(u.email)
AND o.user_id IS NULL;