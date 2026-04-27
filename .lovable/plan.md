# Allow participant selection in Pledge flow

## Problem
When a Pledge campaign uses `pledge_scope = 'participant'` and the visitor lands on the base campaign URL (no `/{rosterMemberSlug}` in the path), `PledgePurchaseFlow` only shows a warning ("use a participant's personal link") and disables the Continue button. There is no way for the donor to choose who to pledge to.

This breaks the most common entry point — a donor visits the main campaign page and wants to pick a player to support, just like the main donation checkout flow already supports for roster-attributed campaigns.

## Fix

Add a participant selection step at the top of `PledgePurchaseFlow` that activates when:
- `campaign.pledge_scope === 'participant'`
- `attributedRosterMember` prop is `null` (no slug-based attribution)

Selecting a participant locally sets the attributed member for the rest of the flow. If a slug-based `attributedRosterMember` IS present, that participant is pre-selected and locked (current behavior).

### UI

A new first sub-step `'participant'` is added before `'amount'`. When required:

```
┌──────────────────────────────────────────┐
│ Who are you pledging for?                │
│ ┌──────────────────────────────────────┐ │
│ │ Search by name…                      │ │
│ └──────────────────────────────────────┘ │
│ • Alex Johnson                           │
│ • Brooke Lee                             │
│ • Carlos Mendez                          │
│   …                                      │
└──────────────────────────────────────────┘
```

- Searchable scrollable list (sorted alphabetically) of all active roster members tied to the campaign's group.
- Selecting a member advances to the existing Amount step and shows "You're supporting {Name}" in the card description (matching the slug-attributed UX).
- A "Change participant" link in the header lets them go back (only when not URL-attributed).
- The yellow warning banner is removed — no longer needed.

### Data

Reuse the existing leaderboard query pattern (`src/lib/leaderboard.ts`) since it already pulls active roster members + profile names by `roster_id`. Add a small helper `fetchCampaignParticipants(campaignId)` in `src/lib/leaderboard.ts` (or inline in the component) that:

1. Looks up rosters for `campaign.group_id` (campaign already has `groups.organization_id`; we'll also pass `group_id`).
2. Returns `{ id, firstName, lastName }[]` from `organization_user` joined to `profiles`, filtered by `active_user = true` and `roster_id IN (...)`.

This relies on existing RLS for rosters (memo: `roster-rls-policy-player-access`) which already allows public read of roster member display info via the same pattern used by the leaderboard page.

## Technical changes

**`src/components/campaign-landing/PledgePurchaseFlow.tsx`**
- Add `group_id` to the `campaign` prop type (already available in parent).
- Add `selectedRosterMember` state (initialized from `attributedRosterMember` prop).
- Add `'participant'` to the `step` union; default to `'participant'` when `isParticipantScope && !attributedRosterMember`, else `'amount'`.
- Fetch participants on mount when needed; render search + list UI for the `'participant'` step.
- Replace all references to `attributedRosterMember` inside the component body with `selectedRosterMember` (mandate text, review summary, submit payload, header copy).
- Remove the amber warning block.

**`src/pages/CampaignLanding.tsx`**
- Pass `group_id` through to `<PledgePurchaseFlow campaign={...} />` (it's already on the campaign record).

**`src/lib/leaderboard.ts`** (or co-located in the component)
- Export a lightweight `fetchCampaignParticipants(groupId)` returning `{ id, firstName, lastName }[]`.

No backend / edge function / DB changes required — `create-pledge-setup` already accepts `attributedRosterMemberId` and validates it server-side.

## Out of scope
- Showing per-participant pitch content on the picker (donor can still visit the personal link for that).
- Changing how slug-based attribution works.
