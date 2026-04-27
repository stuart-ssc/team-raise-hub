## Why the dropdown is empty

The campaign genuinely has 3 active roster members (Player One, Second Player, Taylor Player on the Varsity Basketball roster). The data is there.

The problem is **Row Level Security**. The campaign landing page is public, so the donor viewing it is either anonymous or a logged-in user with no relationship to that organization. The current dropdown in `PledgePurchaseFlow.tsx` queries three tables directly from the browser:

1. `rosters` (filtered by `group_id`)
2. `organization_user` (filtered by those roster ids)
3. `profiles` (filtered by those user ids)

RLS on `organization_user` and `profiles` blocks unaffiliated users from reading those rows, so the queries silently return `[]` and the Select shows "No participants available". This is the same reason the rest of the landing page uses an edge function (`get-roster-member-by-slug`) for the slug-based single-member lookup.

## Fix

Mirror the existing pattern: introduce a small public edge function that uses the service role key to return the participant list for one campaign, and have the dropdown call it instead of querying tables directly.

### 1. New edge function: `get-campaign-roster-members`
- Input: `{ campaignId: string }`
- Use `SUPABASE_SERVICE_ROLE_KEY` admin client (same pattern as `get-roster-member-by-slug`).
- Look up the campaign to get `group_id` and confirm it is published (so we don't leak draft campaign rosters).
- Fetch active rosters for that group, then `organization_user` rows joined to `profiles`, restricted to participant-type roles (Team Player, Club Participant, etc. — same set the leaderboard uses) and `active_user = true`.
- Return `{ members: [{ id, firstName, lastName }] }` sorted alphabetically.
- Register in `supabase/config.toml` with `verify_jwt = false` so it works for anonymous donors.

### 2. Update `PledgePurchaseFlow.tsx`
- Replace the existing `useEffect` that calls `rosters` / `organization_user` / `profiles` directly with a single `supabase.functions.invoke('get-campaign-roster-members', { body: { campaignId: campaign.id } })`.
- Keep all the existing UI: the inline required `<Select>`, loading placeholder, and the disabled "Continue" guard until a participant is chosen.
- Drop the now-unused `group_id` query path; the edge function owns that lookup.

### 3. No schema or RLS changes
We deliberately do not loosen RLS on `organization_user` or `profiles`. The edge function is the controlled, minimal disclosure surface (only first/last name + roster_member id of active participants on a published campaign).

## Result

On `/c/<slug>` for a participant-scope pledge campaign, the donor sees a populated dropdown with Player One, Second Player, and Taylor Player, can pick one, and proceed through the existing amount → donor info → review → Stripe flow.