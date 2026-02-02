

## Fix: Update invite-user Function to Use Correct Supabase API

### Problem
The `getUserByEmail` method doesn't exist in the Supabase JS client. The error logs show:
```
TypeError: supabaseAdmin.auth.admin.getUserByEmail is not a function
```

### Solution
Replace `getUserByEmail` with `listUsers()` and filter the results by email.

---

### Changes Required

**File: `supabase/functions/invite-user/index.ts`**

Update lines 39-46 to use the correct API:

```typescript
// Current (BROKEN)
const { data: existingAuthData, error: lookupError } = await supabaseAdmin.auth.admin
  .getUserByEmail(normalizedEmail);

if (existingAuthData?.user && !lookupError) {
  userId = existingAuthData.user.id;
}
```

```typescript
// Fixed (WORKING)
const { data: userListData, error: lookupError } = await supabaseAdmin.auth.admin
  .listUsers();

// Find user by email in the returned list
const existingUser = userListData?.users?.find(
  (u) => u.email?.toLowerCase() === normalizedEmail
);

if (existingUser && !lookupError) {
  // User exists - use their existing ID
  userId = existingUser.id;
  console.log(`Found existing user with email ${normalizedEmail}: ${userId}`);
} else {
  // Create new user
  // ... existing creation logic
}
```

---

### Technical Notes

1. **API Difference**: The Supabase Admin API uses `listUsers()` to get all users, then we filter client-side by email
2. **Performance**: For production systems with many users, you'd want pagination, but for now this approach is simple and effective
3. **Case Insensitivity**: Both emails are lowercased to ensure proper matching

---

### Files to Modify
- `supabase/functions/invite-user/index.ts`

---

### After Deployment
1. The edge function will be automatically redeployed
2. Try inviting `stuartborders@gmail.com` again
3. A new user should be created with that email (not your admin account)

