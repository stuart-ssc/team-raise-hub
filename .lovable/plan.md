You're right — my previous fix did not actually solve the live issue. I checked the database policies, and the migration I described is not applied in the database. The active `groups` UPDATE policy is still the old `school_user`-based one, so the save returns no updated row and the form shows “Save blocked.”

Plan:

1. Replace the live group update policy
   - Add a new migration that drops the old policy:
     - `Users with qualifying roles can update groups at their school`
   - Create the correct `organization_user`-based UPDATE policy.
   - Allow:
     - organization admins for any group in their organization
     - program managers/coaches for their assigned group
     - system admins

2. Make the migration idempotent and targeted
   - Drop both the old legacy policy and the previously attempted policy name if present.
   - Recreate one canonical policy so future migrations do not leave duplicate/conflicting rules.
   - Keep SELECT public as currently designed; only fix UPDATE.

3. Improve the form’s save diagnostics
   - Keep the existing `select("id").maybeSingle()` check, but change the “no row returned” message to explicitly say the database rejected the update due to permissions.
   - Do not hide the issue behind a generic success message.

4. Verify against the real database after approval
   - Query `pg_policies` again to confirm the old `school_user` update policy is gone.
   - Confirm the new `organization_user` update policy exists.
   - Confirm the Sample School Varsity Basketball group has `organization_id = 11111111-1111-1111-1111-111111111111`, and the active admins/coaches are linked through `organization_user`.

Technical detail:

The currently active database policy is still:

```sql
EXISTS (
  SELECT 1
  FROM school_user su
  JOIN user_type ut ON su.user_type_id = ut.id
  WHERE su.user_id = auth.uid()
    AND su.school_id = groups.school_id
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
)
```

But the app’s active role system is using `organization_user`, so saves from the dashboard are being filtered out by RLS. The fix needs to replace that live policy, not only add a differently named policy that has not reached the database.