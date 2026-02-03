
# Fix Landing Page Tracking Error

## Problem

The `/for-businesses` page is triggering an error because:
- The page calls `useLandingPageTracking({ pageType: 'marketing', ... })`
- The edge function `track-landing-page-view` only accepts: `['home', 'school', 'district', 'state']`
- When `'marketing'` is sent, the function returns a 400 error: `"Invalid pageType"`

---

## Solution

Add `'marketing'` to the list of valid page types in the edge function.

---

## Change Required

**File:** `supabase/functions/track-landing-page-view/index.ts`  
**Line:** 93

**Current:**
```typescript
const validPageTypes = ['home', 'school', 'district', 'state'];
```

**Updated:**
```typescript
const validPageTypes = ['home', 'school', 'district', 'state', 'marketing'];
```

---

## Why This Fix is Correct

- The TypeScript interface in `useLandingPageTracking.tsx` already includes `'marketing'` as a valid type
- The ForBusinesses page is correctly using this type for analytics
- The edge function validation was simply missing this valid type
- No database schema changes needed - `page_type` column stores strings

---

## Impact

After this fix:
- Marketing pages like `/for-businesses` will track successfully
- Error dialog will no longer appear
- Analytics data will be properly captured for marketing page views
