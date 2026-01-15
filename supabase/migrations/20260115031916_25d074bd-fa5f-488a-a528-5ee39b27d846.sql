-- Add manual order columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS manual_entry boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS entered_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payment_received boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_received_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_received_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payment_notes text,
ADD COLUMN IF NOT EXISTS offline_payment_type text;

COMMENT ON COLUMN public.orders.payment_method IS 'stripe, manual, offline';
COMMENT ON COLUMN public.orders.manual_entry IS 'True if order was manually entered by admin';
COMMENT ON COLUMN public.orders.payment_received IS 'For manual orders - has payment been received';
COMMENT ON COLUMN public.orders.offline_payment_type IS 'check, cash, invoice, wire, other';

-- Add manual order settings to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS allow_manual_orders boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS manual_order_notes text;

-- Add manual order settings to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS allow_manual_orders boolean DEFAULT true;

-- Create index for filtering manual orders
CREATE INDEX IF NOT EXISTS idx_orders_manual_entry ON public.orders(manual_entry) WHERE manual_entry = true;
CREATE INDEX IF NOT EXISTS idx_orders_payment_received ON public.orders(payment_received) WHERE manual_entry = true AND payment_received = false;