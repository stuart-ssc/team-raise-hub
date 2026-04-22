

## Goal
Brand the QR poster PDF with a logo at the top. Pick the best available logo in this priority order:

1. **Group (team) logo** — `groups.logo_url`
2. **School logo** — `schools.logo_file` (when the group is linked to a school)
3. **Organization logo** — `organizations.logo_url`
4. **Sponsorly logo** — `/lovable-uploads/Sponsorly-Logo.png` (final fallback)

The on-screen QR modal stays unchanged; the logo only appears on the downloaded PDF poster.

## Changes

### 1. `src/components/player/QRDialog.tsx`
- Add an optional `logoUrl?: string` prop (the resolved best logo URL chosen by the parent).
- In `handleDownloadPdf`, before drawing the title:
  - If `logoUrl` is provided, attempt to load it into an `<img>` (via a CORS-safe canvas) and convert to a PNG data URL.
  - Add it centered at the top of the PDF with a max height of ~64pt and proportional width (max ~200pt). Push the title/QR/text down accordingly.
  - If loading fails (network/CORS), silently fall back to the bundled Sponsorly logo at `/lovable-uploads/Sponsorly-Logo.png`.
- If `logoUrl` is omitted, use the Sponsorly logo by default.
- Add a small helper `loadImageAsPngDataUrl(url, maxW, maxH)` that returns `{ dataUrl, width, height }` so the layout can scale properly.

### 2. Resolve the right logo at each call site

Add a tiny shared helper `pickBrandLogo({ groupLogo, schoolLogo, orgLogo })` that returns the first non-empty URL or `undefined` (so the dialog falls back to Sponsorly). Place it in `src/components/player/QRDialog.tsx` and export it for reuse.

**`src/pages/MyFundraising.tsx`**
- Extend the campaigns query to also pull:
  ```
  groups:groups(logo_url, organization_id, school_id, schools(logo_file), organizations(logo_url))
  ```
  (the existing query already joins to `groups`; just add the logo fields).
- Store `groupLogo`, `schoolLogo`, `orgLogo` on each `CampaignStat`.
- Pass `logoUrl={pickBrandLogo(...)}` to `<QRDialog />`.

**`src/pages/FamilyDashboard.tsx`**
- Extend the per-child campaign fetch to also pull the same logo fields from `groups`/`schools`/`organizations`.
- Store the resolved `logoUrl` on `qrTarget` and pass it to `<QRDialog />`.

**`src/components/PlayerDashboard.tsx`**
- Extend the campaigns query to include logo fields via `groups(logo_url, schools(logo_file), organizations(logo_url))`.
- Pass `logoUrl={pickBrandLogo(...)}` to `<QRDialog />`.

### 3. PDF layout adjustment
- Top margin block of ~96pt reserved for the logo.
- Logo drawn centered horizontally, top-aligned at y ≈ 40pt, scaled to fit a 200×64pt box preserving aspect ratio.
- Title/subtitle/QR positions shift down so the existing structure (title → campaign → QR → "Scan with…" → URL → footer) still fits cleanly on one letter-size page.

## Out of scope
- Changing the on-screen modal layout.
- Uploading/managing logos (uses whatever is already configured on the team/school/org).
- Branding the PNG-only "Download QR image" output (it remains a clean QR code, as designed).

## Files touched
1. `src/components/player/QRDialog.tsx` — add `logoUrl` prop, image loader, PDF logo block, `pickBrandLogo` helper.
2. `src/pages/MyFundraising.tsx` — fetch group/school/org logos, pass `logoUrl`.
3. `src/pages/FamilyDashboard.tsx` — fetch logos, store on `qrTarget`, pass `logoUrl`.
4. `src/components/PlayerDashboard.tsx` — fetch logos, pass `logoUrl`.

## Verification
- A team with `groups.logo_url` set: poster PDF shows the team logo at top.
- A team with no team logo but a school logo: poster shows the school logo.
- A nonprofit campaign (no school) with only an org logo: poster shows the org logo.
- A campaign with none of the above: poster shows the Sponsorly logo.
- Layout remains balanced; QR and short URL still visibly fit on one page.

