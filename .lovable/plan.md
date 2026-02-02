

# Fix: Invite-User Function Using Email Instead of Name Matching

## Problem Identified

The `invite-user` edge function has a critical bug in its user lookup logic:

**Current (Buggy) Logic:**
```typescript
const { data: existingProfiles } = await supabaseAdmin
  .from("profiles")
  .select("id, first_name, last_name")
  .ilike("first_name", firstName.trim())
  .ilike("last_name", lastName.trim());

if (existingProfiles && existingProfiles.length > 0) {
  userId = existingProfiles[0].id;  // Uses first matching name!
}
```

This finds users by **name** instead of **email**, causing:
- Users with the same name get incorrectly matched
- Your account (Stuart Borders / stuart@sponsorly.io) was matched when inviting stuartborders@gmail.com because both share the name "Stuart Borders"
- The wrong user_id was then associated with the organization_user record

---

## Solution

Change the user lookup to check by **email** instead of name. The email is the unique identifier in the auth system.

### Changes Required

**File: `supabase/functions/invite-user/index.ts`**

**1. Replace the name-based lookup (lines 34-44) with email-based lookup:**

```typescript
// Before (BUGGY - matches by name)
const { data: existingProfiles } = await supabaseAdmin
  .from("profiles")
  .select("id, first_name, last_name")
  .ilike("first_name", firstName.trim())
  .ilike("last_name", lastName.trim());

let userId: string;

if (existingProfiles && existingProfiles.length > 0) {
  userId = existingProfiles[0].id;
}
```

```typescript
// After (CORRECT - matches by email via auth.users)
// Check if user already exists by email in auth.users
const { data: existingAuthUser } = await supabaseAdmin.auth.admin
  .listUsers({ filter: { email: email.trim().toLowerCase() } });

let userId: string;

// Check if user with this email already exists
const existingUser = existingAuthUser?.users?.find(
  u => u.email?.toLowerCase() === email.trim().toLowerCase()
);

if (existingUser) {
  userId = existingUser.id;
  console.log(`Found existing user with email ${email}: ${userId}`);
}
```

**2. Alternative approach using getUserByEmail (simpler):**

```typescript
// Check if user already exists by email
const { data: existingUser, error: lookupError } = await supabaseAdmin.auth.admin
  .getUserByEmail(email.trim().toLowerCase());

let userId: string;

if (existingUser && !lookupError) {
  userId = existingUser.user.id;
  console.log(`Found existing user with email ${email}: ${userId}`);
} else {
  // Create new user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    email_confirm: false,
    user_metadata: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    }
  });
  
  // ... rest of creation logic
}
```

---

## Complete Updated Logic

```typescript
serve(async (req: Request) => {
  // ... CORS handling ...

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, firstName, lastName, userTypeId, organizationId, groupId, rosterId, linkedOrganizationUserId }: InviteUserRequest = await req.json();

    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if user already exists by EMAIL (not name!)
    let userId: string;
    let isNewUser = false;
    
    const { data: existingAuthData, error: lookupError } = await supabaseAdmin.auth.admin
      .getUserByEmail(normalizedEmail);

    if (existingAuthData?.user && !lookupError) {
      // User exists - use their existing ID
      userId = existingAuthData.user.id;
      console.log(`Found existing user with email ${normalizedEmail}: ${userId}`);
    } else {
      // Create new user
      isNewUser = true;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: false,
        user_metadata: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }
      });

      if (authError) {
        console.error("Error creating user:", authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!authData.user) {
        return new Response(
          JSON.stringify({ error: "No user data returned" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userId = authData.user.id;
    }

    // ... rest of the function (organization_user creation, email sending) stays the same ...
  }
});
```

---

## Immediate Cleanup Required

After deploying the fix, you'll need to clean up the incorrect `organization_user` record that was created:

```sql
-- Find and remove the incorrect organization_user record
-- that tied your system admin account to the Softball team
DELETE FROM organization_user 
WHERE user_id = '60d39058-498e-49d3-a6db-6fc3090e8520'  -- Your user ID
  AND organization_id = '91b5cf9e-0d60-40f8-ac9a-e23778e0b82d'
  AND group_id = 'd9e8183f-35cf-4b90-b8c0-3f7b5c088442'  -- Softball group
  AND user_type_id = 'b1f9b52e-b6bd-41ba-8403-e3b7507b47f9';  -- Booster Leader
```

---

## Files to Modify

1. `supabase/functions/invite-user/index.ts` - Fix the user lookup logic

---

## Testing After Fix

1. Navigate to `/system-admin/organizations/:orgId`
2. Click "Invite User" 
3. Enter a name that matches an existing user (e.g., "Stuart Borders")
4. Enter a DIFFERENT email (e.g., "test@example.com")
5. Verify that a NEW user is created with the new email
6. Verify the existing user's account is NOT affected

---

## Summary

The root cause was using **name matching** instead of **email matching** to find existing users. This caused any invitation with a matching name to incorrectly reuse the existing user's ID. The fix ensures users are identified by their unique email address, which is the correct identifier in the authentication system.

