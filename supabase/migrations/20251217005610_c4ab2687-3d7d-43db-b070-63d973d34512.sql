-- Add customer_phone column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_phone TEXT;