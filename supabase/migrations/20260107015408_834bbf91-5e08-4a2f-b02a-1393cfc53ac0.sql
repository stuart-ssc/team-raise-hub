-- Add items_total column to orders table for clear separation of donation amount vs total charge
ALTER TABLE orders ADD COLUMN items_total NUMERIC DEFAULT 0;

-- Backfill existing data: items_total = total_amount - platform_fee
UPDATE orders 
SET items_total = total_amount - COALESCE(platform_fee_amount, 0)
WHERE items_total = 0 OR items_total IS NULL;