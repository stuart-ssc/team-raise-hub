I looked at the actual form code, current live RLS policies, the `groups` table, triggers, and recent data for the Varsity Basketball group.

What I found:
- The current database `UPDATE` policy is now present and includes `WITH CHECK`, so the earlier RLS error path is no longer the main issue.
- The app currently treats a returned row ID as success, but it does not verify that the submitted values were actually persisted.
- The form immediately closes after the success toast, then the list reloads from the database. If the write is a no-op, stale, blocked by a subtle mismatch, or overwritten, the UI still says success.
- The coach role for the sample Varsity Basketball group is `Coach` / `program_manager` and is assigned to that exact group, so the intended permission model should allow edits.

Plan to fix it properly:

1. Make the group save verify persisted values, not just row existence
   - Update `CreateGroupForm.tsx` so the update request returns the saved columns: `id`, `group_name`, `website_url`, `group_type_id`, `logo_url`, `updated_at`.
   - After the update, compare the returned values against the form values.
   - If the returned values do not match, show a destructive error instead of a success message.
   - This prevents false “Success” toasts.

2. Refresh the saved record after mutation before closing the form
   - Run a fresh `.select(...)` for the edited group immediately after the update.
   - Use that fresh row as the source of truth.
   - Only call `onSuccess()` after the refreshed row confirms the new values are stored.

3. Preserve and correctly handle logo removal/replacement
   - The current “Remove” button only clears local preview state; it does not save `logo_url: null` unless a new logo is uploaded.
   - Add explicit state for “logo was removed” so clicking Remove actually clears the saved logo on submit.
   - Keep existing logo unchanged when the user does nothing.

4. Align coach/program-manager permissions in UI and database logic
   - Keep the secure database policy based on `organization_user` and `user_type.permission_level`.
   - Ensure the form’s update is scoped to the coach’s assigned `organization_id` and `group_id`, so a coach can edit only their own group.
   - If the active role is not the assigned coach/admin role, show a clear permission message rather than a misleading success.

5. Improve list refresh reliability
   - Modify the form success callback to pass the confirmed saved group row back to `Groups.tsx`.
   - Refresh the list after successful save, and optionally update the edited row optimistically from the confirmed database response to avoid stale display.

6. Verify with the actual failing scenario
   - Log in/use the coach flow for Varsity Basketball.
   - Edit a field such as website or group name.
   - Confirm the network response contains the changed values.
   - Confirm the `groups` table has the changed values.
   - Reopen the edit form and verify the values load from the database.

Technical details:
- Primary file to change: `src/components/CreateGroupForm.tsx`.
- Supporting change: `src/pages/Groups.tsx` success handler typing/refresh.
- Database migration only if final verification shows the live policy still allows a misleading no-op for a specific coach case. The current policy appears structurally correct, so I will first fix the client-side false success and persistence verification.
- I will not loosen public read access or bypass RLS. Coach permissions will remain tied to `organization_user` and the assigned group.