
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

  -- Skip if this is an UPDATE and the order was already succeeded/completed
  -- This prevents duplicate counting when other fields are updated on an already-successful order
  IF TG_OP = 'UPDATE' AND OLD.status IN ('succeeded', 'completed') THEN
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
