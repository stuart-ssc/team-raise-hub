-- 1. Harden the donor profile trigger to handle status downgrades
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
  was_successful boolean;
  is_successful boolean;
  new_last_donation timestamptz;
BEGIN
  -- Determine prior and current success state
  was_successful := (TG_OP = 'UPDATE' AND OLD.status IN ('succeeded', 'completed') AND OLD.customer_email IS NOT NULL);
  is_successful := (NEW.status IN ('succeeded', 'completed') AND NEW.customer_email IS NOT NULL);

  -- No relevant change: neither was nor is successful
  IF NOT was_successful AND NOT is_successful THEN
    RETURN NEW;
  END IF;

  -- No-op: stays successful (e.g. succeeded -> completed) and email/amount unchanged
  IF was_successful AND is_successful THEN
    RETURN NEW;
  END IF;

  -- Resolve organization from the relevant row (use NEW for adds, OLD for reversals)
  IF is_successful THEN
    SELECT g.organization_id INTO org_id
    FROM campaigns c
    JOIN groups g ON c.group_id = g.id
    WHERE c.id = NEW.campaign_id;
  ELSE
    SELECT g.organization_id INTO org_id
    FROM campaigns c
    JOIN groups g ON c.group_id = g.id
    WHERE c.id = OLD.campaign_id;
  END IF;

  IF org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- ============================================================
  -- ADD PATH: order is becoming successful (insert or transition in)
  -- ============================================================
  IF is_successful AND NOT was_successful THEN
    order_net_amount := calculate_order_items_total(NEW.items);

    INSERT INTO donor_profiles (
      email, first_name, last_name, organization_id,
      total_donations, donation_count, first_donation_date,
      last_donation_date, lifetime_value
    )
    VALUES (
      NEW.customer_email,
      split_part(NEW.customer_name, ' ', 1),
      split_part(NEW.customer_name, ' ', 2),
      org_id,
      order_net_amount, 1, NEW.created_at, NEW.created_at, order_net_amount
    )
    ON CONFLICT (email, organization_id)
    DO UPDATE SET
      total_donations = donor_profiles.total_donations + order_net_amount,
      donation_count = donor_profiles.donation_count + 1,
      last_donation_date = GREATEST(donor_profiles.last_donation_date, NEW.created_at),
      lifetime_value = donor_profiles.lifetime_value + order_net_amount,
      updated_at = now()
    RETURNING id INTO donor_id;

    -- Recompute engagement score
    SELECT
      LEAST(100, GREATEST(0,
        (40 - LEAST(40, EXTRACT(DAY FROM (now() - dp.last_donation_date)))) +
        LEAST(30, dp.donation_count) +
        LEAST(30, FLOOR(dp.lifetime_value / 10000))
      )) INTO engagement
    FROM donor_profiles dp
    WHERE dp.id = donor_id;

    UPDATE donor_profiles SET engagement_score = engagement WHERE id = donor_id;

    INSERT INTO donor_activity_log (donor_id, activity_type, activity_data)
    VALUES (donor_id, 'donation', jsonb_build_object(
      'order_id', NEW.id,
      'amount', order_net_amount,
      'campaign_id', NEW.campaign_id
    ));

    RETURN NEW;
  END IF;

  -- ============================================================
  -- SUBTRACT PATH: order is leaving a successful state
  -- ============================================================
  IF was_successful AND NOT is_successful THEN
    order_net_amount := calculate_order_items_total(OLD.items);

    SELECT id INTO donor_id
    FROM donor_profiles
    WHERE email = OLD.customer_email AND organization_id = org_id;

    IF donor_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Recompute last_donation_date from remaining successful orders for this donor/org
    SELECT MAX(o.created_at) INTO new_last_donation
    FROM orders o
    JOIN campaigns c ON o.campaign_id = c.id
    JOIN groups g ON c.group_id = g.id
    WHERE g.organization_id = org_id
      AND o.customer_email = OLD.customer_email
      AND o.status IN ('succeeded', 'completed')
      AND o.id <> OLD.id;

    UPDATE donor_profiles
    SET
      total_donations = GREATEST(0, COALESCE(total_donations, 0) - order_net_amount),
      lifetime_value = GREATEST(0, COALESCE(lifetime_value, 0) - order_net_amount),
      donation_count = GREATEST(0, COALESCE(donation_count, 0) - 1),
      last_donation_date = new_last_donation,
      updated_at = now()
    WHERE id = donor_id;

    -- Recompute engagement score (handle null last_donation_date)
    SELECT
      LEAST(100, GREATEST(0,
        CASE
          WHEN dp.last_donation_date IS NULL THEN 0
          ELSE (40 - LEAST(40, EXTRACT(DAY FROM (now() - dp.last_donation_date))))
        END +
        LEAST(30, dp.donation_count) +
        LEAST(30, FLOOR(dp.lifetime_value / 10000))
      )) INTO engagement
    FROM donor_profiles dp
    WHERE dp.id = donor_id;

    UPDATE donor_profiles SET engagement_score = engagement WHERE id = donor_id;

    INSERT INTO donor_activity_log (donor_id, activity_type, activity_data)
    VALUES (donor_id, 'donation_reversed', jsonb_build_object(
      'order_id', OLD.id,
      'amount', order_net_amount,
      'campaign_id', OLD.campaign_id,
      'old_status', OLD.status,
      'new_status', NEW.status
    ));

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Update recalculate_donor_stats to include 'completed' orders alongside 'succeeded'
CREATE OR REPLACE FUNCTION public.recalculate_donor_stats(p_organization_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(email text, old_total numeric, new_total numeric, old_count integer, new_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    WHERE o.status IN ('succeeded', 'completed')
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

  -- Update donors that have matching successful orders
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
    WHERE o.status IN ('succeeded', 'completed')
    GROUP BY o.customer_email, g.organization_id
  ) stats
  WHERE dp.email = stats.customer_email
    AND dp.organization_id = stats.organization_id
    AND (p_organization_id IS NULL OR dp.organization_id = p_organization_id);

  -- Zero out donors with NO matching successful orders (the stale ones)
  UPDATE donor_profiles dp
  SET
    total_donations = 0,
    donation_count = 0,
    lifetime_value = 0,
    first_donation_date = NULL,
    last_donation_date = NULL,
    updated_at = now()
  WHERE (p_organization_id IS NULL OR dp.organization_id = p_organization_id)
    AND NOT EXISTS (
      SELECT 1
      FROM orders o
      JOIN campaigns c ON o.campaign_id = c.id
      JOIN groups g ON c.group_id = g.id
      WHERE g.organization_id = dp.organization_id
        AND o.customer_email = dp.email
        AND o.status IN ('succeeded', 'completed')
    )
    AND (dp.total_donations <> 0 OR dp.donation_count <> 0 OR dp.lifetime_value <> 0);
END;
$function$;

-- 3. One-time repair across all organizations
SELECT public.recalculate_donor_stats(NULL);