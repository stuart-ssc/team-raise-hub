
## Fix Oversized Icons in System Admin Pages

### Summary
The icons on the System Admin Organization Detail page (and potentially other System Admin pages) are displaying at 2.5rem instead of 1rem. This will add explicit `!important` sizing or inline styles to ensure icons render correctly at 1rem (16px) throughout the System Admin area.

---

### Root Cause Analysis
After thorough investigation:
- The code shows `h-4 w-4` classes on icons in `OrganizationDetail.tsx`
- The `button.tsx` component has `[&_svg]:size-4` which should enforce 1rem for SVGs inside buttons
- The 2.5rem inline styles are correctly isolated to only `Login.tsx` and `Signup.tsx`

The issue may be a CSS specificity conflict where the button's `size-4` class is being overridden. To guarantee correct sizing, we'll add explicit inline styles to icons that are appearing too large.

---

### Changes Required

**1. src/pages/SystemAdmin/OrganizationDetail.tsx**

Update all Lucide icon components in the stats cards and action buttons to use explicit `style={{ height: '1rem', width: '1rem' }}` or use `!important` Tailwind classes:

- Line 502 (ArrowLeft): Add `style={{ height: '1rem', width: '1rem' }}`
- Line 546 (Edit in button): Add `style={{ height: '1rem', width: '1rem' }}`
- Line 550 (Archive in button): Add `style={{ height: '1rem', width: '1rem' }}`
- Line 562 (FolderOpen in card): Add `style={{ height: '1rem', width: '1rem' }}`
- Line 575 (Users in card): Add `style={{ height: '1rem', width: '1rem' }}`
- Line 588 (TrendingUp in card): Add `style={{ height: '1rem', width: '1rem' }}`
- Line ~601 (DollarSign in card): Add `style={{ height: '1rem', width: '1rem' }}`

**Example transformation:**
```tsx
// Before
<FolderOpen className="h-4 w-4 text-primary" />

// After
<FolderOpen className="text-primary" style={{ height: '1rem', width: '1rem' }} />
```

**2. Review Other System Admin Pages**

Check and apply the same fix to:
- `src/pages/SystemAdmin/Dashboard.tsx`
- `src/pages/SystemAdmin/BusinessesList.tsx`
- `src/pages/SystemAdmin/OrganizationsList.tsx`
- `src/pages/SystemAdmin/VerificationQueue.tsx`

Any icons using `h-4 w-4` classes should be updated to use inline styles for guaranteed 1rem sizing.

---

### Alternative Approach

If the issue is widespread, we could modify the `button.tsx` component to use `!important`:

```tsx
// Change from:
"[&_svg]:size-4"

// To:
"[&_svg]:!size-4"
```

This would enforce 1rem sizing for all button SVGs with higher specificity.

---

### Testing
After implementation:
1. Navigate to `/system-admin/organizations`
2. Click on an organization to view the detail page
3. Verify that all icons (Back arrow, Edit, Archive, Groups, Users, Campaigns, Revenue) display at 1rem (16px)
4. Verify that Login and Signup pages still show social login icons at 2.5rem
