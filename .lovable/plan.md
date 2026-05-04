## Goal

On every published (and preview) fundraiser landing page — Donation, Pledge, Sponsorship, Merchandise, Event — apply branding in this priority order:

1. **Group/team** logo + primary/secondary color (if set)
2. **Organization** logo + primary/secondary color (if set)
3. **Template default** (current hard-coded styling)

Currently only `CampaignLanding.tsx` reads the school's `Primary Color` for the (legacy) generic hero. The five new templates (Donation/Pledge/Sponsorship/Merch/Event) ignore branding entirely. Groups don't store colors yet, and organizations' `primary_color` / `logo_url` are not threaded into the templates.

## Plan

### 1. Database

Add brand color columns to `groups` (logo already exists as `groups.logo_url`):

```sql
alter table public.groups
  add column if not exists primary_color text,
  add column if not exists secondary_color text;
```

Schools already have `"Primary Color"` / `"Secondary Color"` and `logo_file`; organizations already have `primary_color`, `secondary_color`, `logo_url`. No changes needed there.

### 2. Branding resolver

New helper `src/lib/campaignBranding.ts` exporting:

```ts
export interface ResolvedBranding {
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  source: "group" | "organization" | "school" | "template";
}
export function resolveCampaignBranding(campaign): ResolvedBranding
```

Resolution order per field (independently — e.g. group may supply logo while org supplies color):
1. `groups.logo_url` / `groups.primary_color` / `groups.secondary_color`
2. `groups.organizations.logo_url` / `.primary_color` / `.secondary_color`
3. (Schools only as final fallback for color, since school colors already power existing pages: `groups.schools."Primary Color"` / `.logo_file`)
4. `null` → template uses its built-in default

Plus a small util `isColorDark(hex)` (already inlined in `CampaignLanding.tsx` — extract here).

### 3. Fetch the data

Update the campaign select in:
- `src/pages/CampaignLanding.tsx` (published path)
- `supabase/functions/get-campaign-preview/index.ts` (preview path)

to also include:
```
groups (
  ...,
  logo_url, primary_color, secondary_color,
  organizations ( id, name, logo_url, primary_color, secondary_color ),
  schools ( ..., logo_file )
)
```

### 4. Thread branding into templates

`CampaignLanding.tsx` resolves branding once and passes a `branding` prop to each landing component:

- `DonationLanding`
- `PledgeLanding`
- `SponsorshipLanding`
- `MerchandiseLanding`
- `EventLanding`

Each template uses `branding`:
- **Hero background**: if a primary color exists and there is no campaign image, tint the hero with that color (gradient like the existing `heroStyle`). If there is an image, keep the dark photo treatment but use brand color on accents (CTA buttons, progress bar, chips, eyebrow text, section dividers).
- **Logo**: render `branding.logoUrl` in the hero header strip (top-left, near org/group name) when present. When absent, render nothing (no Sponsorly logo swap).
- **Accent / CTA color**: replace the hard-coded primary button color with an inline `style={{ backgroundColor: branding.primaryColor ?? undefined }}` (and contrasting text via `isColorDark`). Same for progress bars, tags, and "ends in" chips currently using `bg-primary` etc.
- Secondary color used for hover / borders / progress track when present.

Defaults remain identical when `branding.source === "template"` (no regressions).

### 5. Editors

- `EditOrganizationDialog` / `OrganizationSettings` already expose org logo + primary color — no change.
- `CreateGroupForm` already handles `logo_url`. Add two color inputs (color picker + hex) for `primary_color` and `secondary_color`, mirroring the org settings UI. Persist on insert/update.

### 6. AI schema

Register `groups.primary_color` / `secondary_color` in `src/lib/ai/campaignSchema.ts` so the AI assistant can set group colors when asked (logo upload remains manual).

## Files touched

- new: `supabase/migrations/<ts>_group_brand_colors.sql`
- new: `src/lib/campaignBranding.ts`
- edit: `src/pages/CampaignLanding.tsx`
- edit: `supabase/functions/get-campaign-preview/index.ts`
- edit: `src/components/campaign-landing/donation/DonationLanding.tsx`
- edit: `src/components/campaign-landing/pledge/PledgeLanding.tsx`
- edit: `src/components/campaign-landing/sponsorship/SponsorshipLanding.tsx`
- edit: `src/components/campaign-landing/merchandise/MerchandiseLanding.tsx`
- edit: `src/components/campaign-landing/event/EventLanding.tsx`
- edit: `src/components/CreateGroupForm.tsx`
- edit: `src/lib/ai/campaignSchema.ts`

## Out of scope

- Changing dashboard/portal chrome branding.
- Per-campaign color override (still uses group/org cascade).
- Auto-generating logos or palettes.
