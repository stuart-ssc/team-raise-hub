## Findings

The group edit form is currently confusing because it can look like saves are failing:

1. The saved data for Varsity Basketball in the database currently has:
   - Group Type: Sports Team
   - Website Address: blank
   - Logo: blank

2. The screenshot shows the edit form did not load the saved Group Type, even though it exists in the database. The most likely cause is a loading race: the form resets before the group type options are ready, so the Select stays on its placeholder.

3. The current save code logs Supabase errors to the console, but the user-facing error only says “Failed to update group”. If RLS/permission blocks the update, the UI does not explain why.

4. The current database `groups` UPDATE policy is still based on the legacy `school_user` table, but the app now uses `organization_user` for coach/admin access. For Sample School, there are no active `school_user` rows tied to Varsity Basketball, so a coach can see the form via `organization_user` but may be blocked from updating by RLS.

## Plan

### 1. Fix the edit form loading behavior
Update `CreateGroupForm.tsx` so it loads the full group record consistently when editing, including:
- `group_name`
- `website_url`
- `group_type_id`
- `logo_url`

The form will reset only after the edit record is fetched, and the Group Type select will receive the saved value after the options are loaded.

### 2. Show existing logo and saved values clearly
Update the edit form so saved information is visibly loaded:
- Show existing logo if `logo_url` is already saved.
- Keep the existing logo unless the user uploads a replacement.
- Show a clearer loading state while editing data is being fetched.

### 3. Improve save feedback
Update the save handler to:
- Show the actual Supabase error message in the toast when a save fails.
- Avoid closing the form unless the update actually succeeds.
- Keep the current “Success” message only after a confirmed save.

### 4. Fix group update permissions in Supabase
Add a migration that updates `groups` RLS to match the current app authorization model:
- Organization admins can update groups in their organization.
- Program managers/coaches can update their assigned group.
- System admins keep access.
- Keep public read behavior needed for public hub pages.

This fixes the mismatch where the UI uses `organization_user`, but the `groups` table update policy still checks legacy `school_user` rows.

### 5. Verify after implementation
After changes are approved and applied:
- Re-open Varsity Basketball edit form.
- Confirm “Sports Team” loads instead of “Select group type”.
- Save a website URL.
- Confirm it persists in the database and reloads in the form.

## Technical details

The key policy change will replace or supplement the current `groups` UPDATE policy, which currently checks `school_user`, with an `organization_user` based check similar to:

```sql
exists (
  select 1
  from public.organization_user ou
  join public.user_type ut on ut.id = ou.user_type_id
  where ou.user_id = auth.uid()
    and ou.organization_id = groups.organization_id
    and ou.active_user = true
    and (
      ut.permission_level = 'organization_admin'
      or (
        ut.permission_level = 'program_manager'
        and ou.group_id = groups.id
      )
    )
)
```

This aligns the database with the dashboard’s current coach/admin role system.