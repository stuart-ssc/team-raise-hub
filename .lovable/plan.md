

# Fix: Roster Member Link Generation "Unauthorized" Error

## Problem
When enabling roster attribution on the "Tates Creek Softball Donation" campaign, the `generate-roster-member-links` edge function fails with an "Unauthorized" error. This happens because the function uses the authenticated user's client for all database queries, but RLS policies on tables like `organization_user`, `rosters`, and `profiles` block those queries.

## Root Cause
The edge function creates a single Supabase client using the user's auth token. While this correctly identifies *who* the user is, the subsequent queries to `campaigns`, `organization_user`, `rosters`, `profiles`, and `roster_member_campaign_links` are all filtered by RLS. The joins fail or return empty results, causing the function to error out.

## Fix
**File:** `supabase/functions/generate-roster-member-links/index.ts`

1. Keep the authenticated client for verifying the user's identity (getUser call)
2. Create a second **admin client** using `SUPABASE_SERVICE_ROLE_KEY` for all database read/write operations
3. Use the admin client for:
   - Fetching campaign details
   - Verifying user permissions (organization_user check)
   - Querying rosters and roster members
   - Checking/inserting roster_member_campaign_links

This follows the same pattern already established in other edge functions (`create-stripe-checkout`, `get-roster-member-by-slug`) as documented in your project's architecture notes.

## Technical Details

```text
Current flow (broken):
  User Request --> Auth Client --> getUser (OK) --> Query tables (BLOCKED by RLS)

Fixed flow:
  User Request --> Auth Client --> getUser (OK)
                   Admin Client --> Query tables (bypasses RLS)
```

No database changes or new secrets are needed -- `SUPABASE_SERVICE_ROLE_KEY` is already available to all edge functions by default.

