# Apply branding cascade to template accent colors

## Problem
The branding wrapper added in the previous step overrides `--primary` (and `--accent`/`--ring`), so any element using `bg-primary` / `text-primary` already picks up brand colors. But the **Merchandise** template (gold) and **Event** template (coral) use their own hard-coded CSS variables — `--merch-accent` and `--event-accent` — defined in `src/index.css`. These never get overridden, so the bourbon raffle still shows gold instead of the Kentucky Baseball Club's blue.

The Donation, Pledge, and Sponsorship templates already drive their accent off `--primary`, so they're effectively covered — but we'll audit them and switch any stray hard-coded brand values to the cascade as well.

## Resolution rule (unchanged)
Group color → Organization color → School color → Template default. If none of group/org/school provides a color, the template's existing accent (gold for merch, coral for event) is preserved.

## Changes

### 1. `src/lib/campaignBranding.ts` — extend `brandingStyleVars`
When a branded primary color is resolved, also override the template-specific accent CSS variables so they inherit the brand:

```ts
if (primaryHsl) {
  vars["--primary"] = primaryHsl;
  vars["--ring"] = primaryHsl;
  vars["--merch-accent"]  = primaryHsl;   // NEW
  vars["--event-accent"]  = primaryHsl;   // NEW
  vars["--primary-foreground"] = ...;
}
```

These are scoped to the `<BrandedLandingWrapper>` div, so the rest of the app is unaffected. When no brand color exists, the variables stay at their `:root` defaults (gold/coral).

### 2. Audit landing templates
- **MerchandiseLanding.tsx** — keeps `var(--merch-accent)` references; they now resolve to brand color when branded.
- **EventLanding.tsx** — same, via `var(--event-accent)`.
- **DonationLanding / PledgeLanding / SponsorshipLanding** — verify they use `bg-primary` / `text-primary` (already cascaded) and replace any incidental hard-coded brand colors with `primary` tokens. From the search these three templates don't define their own accent vars, so no change expected beyond a quick read-through.

### 3. No DB or schema changes
The cascade resolver, group color columns, and editor color pickers are already in place from the previous step.

## Verification
- Bourbon raffle (Kentucky Baseball Club) → hero badge dot, progress bar, "Continue to checkout" button, "Available items"/"Get your" eyebrow, and item card left border should render in the club's blue instead of gold.
- A merchandise/event campaign whose group, org, and school have **no** colors set continues to show the original gold/coral defaults.
- Donation, pledge, and sponsorship templates continue to render correctly with brand `--primary` already wired up.
