
## Fix: Add Missing /system-admin Route

### Problem
When logging in as a system admin (Stuart@schoolsponsorconnect.com), the `DashboardRedirect` component correctly identifies the user as a system admin and redirects to `/system-admin`. However, this route doesn't exist in the routing configuration, causing a 404 error.

### Root Cause
The `SystemAdminDashboard` component is imported in `App.tsx` (line 37) but is never assigned to a route. All other system admin routes exist (`/system-admin/organizations`, `/system-admin/verification`, etc.) except the base `/system-admin` route.

### Solution
Add the missing route for `/system-admin` that renders the `SystemAdminDashboard` component.

### Changes Required

**File: `src/App.tsx`**

Add a new route before the other system-admin routes (around line 186):

```tsx
<Route path="/system-admin" element={<ProtectedRoute><SystemAdminGuard><SystemAdminDashboard /></SystemAdminGuard></ProtectedRoute>} />
```

This route will:
- Be protected (requires authentication)
- Be guarded by `SystemAdminGuard` (requires `system_admin: true` in profiles)
- Render the `SystemAdminDashboard` component

### Technical Details

| File | Change |
|------|--------|
| `src/App.tsx` | Add route: `/system-admin` → `SystemAdminDashboard` |

### Result
System admins will be able to access `/system-admin` and see the System Admin Dashboard with platform stats and quick actions.
