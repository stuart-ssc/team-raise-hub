

# Fix: Nonprofit Registration - Use a Single Database Function

## Root Cause

The registration fails because of a chicken-and-egg problem with RLS:

1. INSERT into `organizations` succeeds, but `.select().single()` triggers a SELECT
2. The SELECT policy on `organizations` requires the user to already exist in `organization_user`
3. But `organization_user` is created in step 4 -- after the SELECT is needed

The same problem exists for `groups` (step 3 also uses `.select().single()`).

No amount of INSERT policy tweaking will fix this because the problem is with **SELECT** policies, not INSERT policies.

## Solution: Single `register_nonprofit` Database Function

Create a `SECURITY DEFINER` database function that performs the entire registration in one atomic transaction. This:

- Bypasses RLS entirely (runs as the function owner, not the user)
- Ensures all-or-nothing: if any step fails, everything rolls back automatically
- Eliminates orphaned records from partial failures
- Makes registration simple and reliable

### 1. SQL Migration -- Create `register_nonprofit` function

```sql
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
  -- Get the authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Step 1: Create organization
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

  -- Step 2: Create nonprofit details (if EIN or mission provided)
  IF p_ein IS NOT NULL OR p_mission_statement IS NOT NULL THEN
    INSERT INTO nonprofits (organization_id, ein, mission_statement)
    VALUES (v_org_id, p_ein, p_mission_statement);
  END IF;

  -- Step 3: Create default group
  INSERT INTO groups (group_name, organization_id, school_id, use_org_payment_account, status)
  VALUES ('General Fund', v_org_id, NULL, TRUE, TRUE)
  RETURNING id INTO v_group_id;

  -- Step 4: Look up user type
  SELECT id INTO v_user_type_id
  FROM user_type WHERE name = p_user_role;

  IF v_user_type_id IS NULL THEN
    RAISE EXCEPTION 'Invalid role: %', p_user_role;
  END IF;

  -- Step 5: Create organization_user link
  INSERT INTO organization_user (user_id, organization_id, group_id, user_type_id, active_user)
  VALUES (v_user_id, v_org_id, v_group_id, v_user_type_id, TRUE);

  RETURN v_org_id;
END;
$$;
```

### 2. Update `NonProfitSetupForm.tsx`

Replace the 4 separate Supabase calls with a single RPC call:

```typescript
const { data: orgId, error } = await supabase.rpc('register_nonprofit', {
  p_name: data.name,
  p_city: data.city,
  p_state: data.state,
  p_zip: data.zip,
  p_phone: data.phone || null,
  p_email: data.email,
  p_ein: data.ein || null,
  p_mission_statement: data.mission_statement || null,
  p_tax_deductible: data.tax_deductible,
  p_user_role: data.user_role,
  p_verification_doc_url: verificationDocUrl || null,
});

if (error) throw error;
```

### 3. Clean up orphaned records

Delete any partial organization records from previous failed attempts by this user.

## Files to Change

| File/Resource | Change |
|---------------|--------|
| SQL Migration | Create `register_nonprofit` function; clean up orphaned records |
| `src/components/NonProfitSetupForm.tsx` | Replace 4 separate inserts with single `supabase.rpc('register_nonprofit', ...)` call |

