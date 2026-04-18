CREATE OR REPLACE FUNCTION public.check_campaign_publish_eligibility()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  org_verified BOOLEAN;
  payment_configured BOOLEAN;
BEGIN
  -- Only run eligibility checks when transitioning INTO 'published' status,
  -- not on every update of an already-published campaign.
  IF NEW.publication_status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.publication_status IS DISTINCT FROM 'published') THEN

    SELECT
      CASE
        WHEN o.requires_verification = true AND o.verification_status != 'approved'
        THEN false
        ELSE true
      END INTO org_verified
    FROM organizations o
    JOIN groups g ON o.id = g.organization_id
    WHERE g.id = NEW.group_id;

    IF NOT org_verified THEN
      RAISE EXCEPTION 'Organization must be verified before publishing campaigns';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM groups g
      LEFT JOIN organizations o ON g.organization_id = o.id
      WHERE g.id = NEW.group_id
      AND (
        (g.payment_processor_config->>'account_enabled')::boolean = true
        OR (
          g.use_org_payment_account = true
          AND (o.payment_processor_config->>'account_enabled')::boolean = true
        )
      )
    ) INTO payment_configured;

    IF NOT payment_configured THEN
      RAISE EXCEPTION 'Payment account must be configured before publishing campaigns';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;