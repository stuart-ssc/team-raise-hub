-- Create function to recalculate donor stats using calculate_order_items_total
CREATE OR REPLACE FUNCTION public.recalculate_donor_stats(p_organization_id uuid DEFAULT NULL)
RETURNS TABLE(email text, old_total numeric, new_total numeric, old_count integer, new_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return a summary of what will change
  RETURN QUERY
  WITH order_stats AS (
    SELECT 
      o.customer_email,
      g.organization_id,
      SUM(calculate_order_items_total(o.items)) as total,
      COUNT(DISTINCT o.id) as order_count,
      MIN(o.created_at) as first_date,
      MAX(o.created_at) as last_date
    FROM orders o
    JOIN campaigns c ON o.campaign_id = c.id
    JOIN groups g ON c.group_id = g.id
    WHERE o.status = 'succeeded'
    GROUP BY o.customer_email, g.organization_id
  )
  SELECT 
    dp.email,
    dp.total_donations as old_total,
    COALESCE(os.total, 0) as new_total,
    dp.donation_count as old_count,
    COALESCE(os.order_count, 0) as new_count
  FROM donor_profiles dp
  LEFT JOIN order_stats os ON dp.email = os.customer_email AND dp.organization_id = os.organization_id
  WHERE (p_organization_id IS NULL OR dp.organization_id = p_organization_id)
    AND (dp.total_donations != COALESCE(os.total, 0) OR dp.donation_count != COALESCE(os.order_count, 0));

  -- Perform the actual update
  UPDATE donor_profiles dp
  SET
    total_donations = COALESCE(stats.total, 0),
    donation_count = COALESCE(stats.order_count, 0)::integer,
    lifetime_value = COALESCE(stats.total, 0),
    first_donation_date = stats.first_date,
    last_donation_date = stats.last_date,
    updated_at = now()
  FROM (
    SELECT 
      o.customer_email,
      g.organization_id,
      SUM(calculate_order_items_total(o.items)) as total,
      COUNT(DISTINCT o.id) as order_count,
      MIN(o.created_at) as first_date,
      MAX(o.created_at) as last_date
    FROM orders o
    JOIN campaigns c ON o.campaign_id = c.id
    JOIN groups g ON c.group_id = g.id
    WHERE o.status = 'succeeded'
    GROUP BY o.customer_email, g.organization_id
  ) stats
  WHERE dp.email = stats.customer_email
    AND dp.organization_id = stats.organization_id
    AND (p_organization_id IS NULL OR dp.organization_id = p_organization_id);
END;
$$;

-- Update the trigger function to use calculate_order_items_total for new orders
CREATE OR REPLACE FUNCTION public.update_donor_profile_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_id uuid;
  donor_id uuid;
  order_net_amount numeric;
  engagement int;
BEGIN
  -- Only process successful orders with customer email
  IF NEW.status NOT IN ('succeeded', 'completed') OR NEW.customer_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get organization_id from campaign
  SELECT g.organization_id INTO org_id
  FROM campaigns c
  JOIN groups g ON c.group_id = g.id
  WHERE c.id = NEW.campaign_id;

  IF org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate net amount using the items (excludes platform fee)
  order_net_amount := calculate_order_items_total(NEW.items);

  -- Upsert donor profile
  INSERT INTO donor_profiles (
    email,
    first_name,
    last_name,
    organization_id,
    total_donations,
    donation_count,
    first_donation_date,
    last_donation_date,
    lifetime_value
  )
  VALUES (
    NEW.customer_email,
    split_part(NEW.customer_name, ' ', 1),
    split_part(NEW.customer_name, ' ', 2),
    org_id,
    order_net_amount,
    1,
    NEW.created_at,
    NEW.created_at,
    order_net_amount
  )
  ON CONFLICT (email, organization_id) 
  DO UPDATE SET
    total_donations = donor_profiles.total_donations + order_net_amount,
    donation_count = donor_profiles.donation_count + 1,
    last_donation_date = NEW.created_at,
    lifetime_value = donor_profiles.lifetime_value + order_net_amount,
    updated_at = now()
  RETURNING id INTO donor_id;

  -- Calculate engagement score (0-100)
  SELECT 
    LEAST(100, GREATEST(0,
      (40 - LEAST(40, EXTRACT(DAY FROM (now() - dp.last_donation_date)))) +
      LEAST(30, dp.donation_count) +
      LEAST(30, FLOOR(dp.lifetime_value / 10000))
    )) INTO engagement
  FROM donor_profiles dp
  WHERE dp.id = donor_id;

  -- Update engagement score
  UPDATE donor_profiles
  SET engagement_score = engagement
  WHERE id = donor_id;

  -- Log the donation activity
  INSERT INTO donor_activity_log (donor_id, activity_type, activity_data)
  VALUES (
    donor_id,
    'donation',
    jsonb_build_object(
      'order_id', NEW.id,
      'amount', order_net_amount,
      'campaign_id', NEW.campaign_id
    )
  );

  RETURN NEW;
END;
$function$;

-- Run the recalculation to fix existing donor data
SELECT * FROM recalculate_donor_stats();