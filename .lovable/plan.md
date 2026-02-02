
# Fix: Broken Database Trigger Causing User Creation Failure

## Root Cause Identified

The error occurs in a **database trigger chain**, not in the edge function code itself:

```
ERROR: record "new" has no field "email"
```

### The Problem Flow

1. Edge function calls `createUser()` → Creates row in `auth.users`
2. Trigger `on_auth_user_created` fires → Inserts row into `profiles`
3. Trigger `on_profile_created_link_donor` fires on `profiles` → Calls `link_donor_profile_on_signup()`
4. This function tries `WHERE LOWER(email) = LOWER(NEW.email)` → **FAILS** because `profiles` table has no `email` column

### Current Broken Function

```sql
CREATE OR REPLACE FUNCTION public.link_donor_profile_on_signup()
RETURNS trigger AS $function$
BEGIN
  UPDATE donor_profiles
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)  -- ERROR: profiles has no email column!
  AND user_id IS NULL;
  
  RETURN NEW;
END;
$function$
```

### Table Structures

| Table | Has `email` column? |
|-------|---------------------|
| `auth.users` | Yes |
| `profiles` | No |
| `donor_profiles` | Yes |

---

## Solution

Fix the `link_donor_profile_on_signup` function to fetch the email from `auth.users` instead of referencing `NEW.email` from the profiles row.

### Fixed Function

```sql
CREATE OR REPLACE FUNCTION public.link_donor_profile_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
BEGIN
  -- Get the email from auth.users since profiles doesn't have an email column
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Link any existing donor_profiles with matching email to this new user
  IF user_email IS NOT NULL THEN
    UPDATE donor_profiles
    SET user_id = NEW.id
    WHERE LOWER(email) = LOWER(user_email)
    AND user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;
```

---

## Technical Details

- **Trigger Location**: `on_profile_created_link_donor` on `public.profiles`
- **Called Function**: `link_donor_profile_on_signup()`
- **Issue**: References `NEW.email` but `profiles` table doesn't have email column
- **Fix**: Query `auth.users` table to get email using `NEW.id`

---

## Implementation

Create a database migration to fix the function:

```sql
-- Fix the link_donor_profile_on_signup function to work with profiles table
-- The profiles table doesn't have an email column, so we need to look it up from auth.users
CREATE OR REPLACE FUNCTION public.link_donor_profile_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
BEGIN
  -- Get the email from auth.users since profiles doesn't have an email column
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Link any existing donor_profiles with matching email to this new user
  IF user_email IS NOT NULL THEN
    UPDATE donor_profiles
    SET user_id = NEW.id
    WHERE LOWER(email) = LOWER(user_email)
    AND user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;
```

---

## After Fix

1. Database migration will update the function
2. User invitation will work correctly
3. Existing functionality (linking donor profiles on signup) will be preserved
4. No edge function changes required - the current code is correct

---

## Files to Create/Modify

- **Database Migration**: Fix `link_donor_profile_on_signup` function to query email from `auth.users`

No code file changes required - the edge function is correct, it's a database-level bug.
