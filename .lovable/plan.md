I found the immediate reason the page still goes blank: `CampaignLanding.tsx` still directly reads `campaign.groups?.schools["Primary Color"]`. For nonprofit fundraisers, `schools` is `null`, so React crashes with:

```text
Cannot read properties of null (reading 'Primary Color')
```

I also found the same school-only assumption in multiple campaign-type templates, so fixing just that one line could expose the next crash depending on the fundraiser type.

Plan:

1. Make the main campaign landing page nonprofit-safe
   - Change the remaining direct `schools["Primary Color"]` access to optional chaining.
   - Normalize organization display text so it uses `school_name + group_name` for school fundraisers, and just `group_name` / organization-style fallback for nonprofit fundraisers.
   - Update the TypeScript shape so `groups.schools` can be `null`.

2. Make all campaign landing templates nonprofit-safe
   - Fix direct `campaign.groups.schools.school_name` references in:
     - `DonationLanding.tsx`
     - `SponsorshipLanding.tsx`
     - `PledgeLanding.tsx`
   - Review already-partial-safe templates:
     - `EventLanding.tsx`
     - `MerchandiseLanding.tsx`
   - Ensure every template renders without requiring a school relationship.

3. Preserve preview behavior
   - Keep the preview banner at the top.
   - Keep preview loading via `slug + preview_token` without authentication.
   - Ensure the checkout action remains blocked while previewing an unpublished fundraiser, including templates with their own `Continue to checkout` buttons.

4. Add a small shared display helper if appropriate
   - To avoid future regressions, create or inline a helper like `getOrganizationLabel(group)` that safely joins school and group names only when each exists.

5. Verify the specific preview link
   - Re-open `/c/kbc-huge-bourbon-raffle-26?preview=1b82ecc4-a6e2-4f94-a946-261bc6bb667c` in the preview.
   - Confirm there is no runtime crash, the unpublished preview banner appears, and nonprofit fundraiser content renders.