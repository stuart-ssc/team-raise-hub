CREATE OR REPLACE FUNCTION public.enforce_verified_business_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  protected_cols text[] := ARRAY[
    'business_name','business_email','business_phone','website_url',
    'ein','industry','address_line1','address_line2','city','state','zip','logo_url'
  ];
  col text;
  old_val text;
  new_val text;
BEGIN
  -- Skip if business is not verified
  IF NEW.verification_status IS DISTINCT FROM 'verified' THEN
    RETURN NEW;
  END IF;

  -- Skip if user is system admin
  IF auth.uid() IS NOT NULL AND public.is_system_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- For each protected column: only block if OLD has a non-empty value AND NEW differs
  FOREACH col IN ARRAY protected_cols LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', col, col)
      INTO old_val, new_val
      USING OLD, NEW;

    IF old_val IS NOT NULL AND old_val <> '' AND new_val IS DISTINCT FROM old_val THEN
      RAISE EXCEPTION 'Cannot modify field ''%'' on a verified business — value is already set. Contact support to make changes.', col
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;