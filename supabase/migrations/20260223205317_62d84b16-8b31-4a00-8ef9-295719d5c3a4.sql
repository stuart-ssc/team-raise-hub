
CREATE OR REPLACE FUNCTION public.register_nonprofit(
  p_name TEXT,
  p_city TEXT,
  p_state TEXT,
  p_zip TEXT,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_ein TEXT DEFAULT NULL,
  p_mission_statement TEXT DEFAULT NULL,
  p_tax_deductible BOOLEAN DEFAULT FALSE,
  p_user_role TEXT DEFAULT 'Executive Director',
  p_verification_doc_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_group_id UUID;
  v_user_type_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO organizations (
    organization_type, name, city, state, zip, phone, email,
    requires_verification, verification_status,
    verification_documents, verification_submitted_at
  ) VALUES (
    'nonprofit', p_name, p_city, p_state, p_zip, p_phone, p_email,
    p_tax_deductible,
    CASE WHEN p_tax_deductible THEN 'pending' ELSE 'approved' END,
    CASE WHEN p_tax_deductible AND p_verification_doc_url IS NOT NULL
      THEN jsonb_build_array(jsonb_build_object(
        'url', p_verification_doc_url,
        'uploaded_at', now()
      ))
      ELSE NULL
    END,
    CASE WHEN p_tax_deductible AND p_verification_doc_url IS NOT NULL
      THEN now() ELSE NULL
    END
  )
  RETURNING id INTO v_org_id;

  IF p_ein IS NOT NULL OR p_mission_statement IS NOT NULL THEN
    INSERT INTO nonprofits (organization_id, ein, mission_statement)
    VALUES (v_org_id, p_ein, p_mission_statement);
  END IF;

  INSERT INTO groups (group_name, organization_id, school_id, use_org_payment_account, status)
  VALUES ('General Fund', v_org_id, NULL, TRUE, TRUE)
  RETURNING id INTO v_group_id;

  SELECT id INTO v_user_type_id
  FROM user_type WHERE name = p_user_role;

  IF v_user_type_id IS NULL THEN
    RAISE EXCEPTION 'Invalid role: %', p_user_role;
  END IF;

  INSERT INTO organization_user (user_id, organization_id, group_id, user_type_id, active_user)
  VALUES (v_user_id, v_org_id, v_group_id, v_user_type_id, TRUE);

  RETURN v_org_id;
END;
$$;
