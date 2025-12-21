-- Fix the function to use price_at_purchase instead of cost
CREATE OR REPLACE FUNCTION public.calculate_order_items_total(items_json JSONB)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total NUMERIC := 0;
  item RECORD;
BEGIN
  IF items_json IS NULL THEN
    RETURN 0;
  END IF;
  
  FOR item IN SELECT * FROM jsonb_to_recordset(items_json) AS x(price_at_purchase NUMERIC, quantity INTEGER)
  LOOP
    total := total + COALESCE(item.price_at_purchase, 0) * COALESCE(item.quantity, 1);
  END LOOP;
  RETURN total;
END;
$$;

-- Refresh the materialized view to pick up the fix
REFRESH MATERIALIZED VIEW roster_member_fundraising_stats;