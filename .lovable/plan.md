

## Goal
Update the QR poster PDF so the title reads "Support {School/Org Name} {Group Name}" with the campaign description below it, and replace the bare "sponsorly.io" footer with a "Powered by [Sponsorly logo]" footer.

## Mockup of new layout
```text
        [ Brand logo (team/school/org) ]

       Support Lincoln High Booster Club
   {Campaign description appears here, wrapped
    to fit within the page width.}

              [   QR  CODE  ]

         Scan with your phone camera
            sponsorly.com/give/...

              Powered by [logo]
```

## Changes

### 1. `src/components/player/QRDialog.tsx`
- Add new optional props passed by every call site:
  - `schoolOrOrgName?: string` — school name (when group is linked to a school) or organization name (nonprofits)
  - `groupName?: string` — e.g. "Booster Club", "Boys Soccer"
  - `campaignDescription?: string` — `campaigns.description`
- In `handleDownloadPdf`:
  - **Title** (line ~199): replace the `Support ${subjectName/campaignName}` logic with:
    - Compose `entityLine = [schoolOrOrgName, groupName].filter(Boolean).join(" ").trim()`
    - Title = `Support ${entityLine}` if `entityLine` is set, else fall back to current behavior (`Support ${subjectName ?? campaignName}`)
  - **Description** (replaces the small grey campaign-name line at `titleY + 30`): if `campaignDescription` is non-empty, use `doc.splitTextToSize(campaignDescription, pageWidth - 120)` and draw it centered at 12pt, grey (`setTextColor(90)`), starting at `titleY + 28`. Compute the rendered block height to push the QR down dynamically (cap at ~4 lines / ~64pt to keep on one page; truncate with "…" if longer).
  - **Footer**: remove the plain "sponsorly.io" text. Instead:
    - Load `/lovable-uploads/Sponsorly-Logo.png` via the existing `loadImageAsPngDataUrl` helper at max ~80×24pt.
    - Draw the text "Powered by" centered at ~10pt grey (`setTextColor(140)`), then the logo immediately to its right, baseline-aligned, both centered as a group at `pageHeight - 40`.
    - Compute the combined width (`textWidth + 6pt gap + logoWidth`) so the pair sits centered.
    - If logo loading fails, fall back to the current "sponsorly.io" text so the footer is never empty.

### 2. Pass the new data from each call site

**`src/pages/MyFundraising.tsx`**
- Extend the two `campaigns` selects (lines 255 and 392) to include `description` and to pull `schools(school_name)` and `organizations(name)` from the `groups` join:
  ```
  id, name, slug, group_directions, enable_roster_attribution, goal_amount, start_date, end_date, description,
  groups:groups(logo_url, group_name, schools(school_name, logo_file), organizations(name, logo_url))
  ```
- Extend `CampaignStat` with `campaignDescription?: string | null`, `groupName?: string | null`, `schoolOrOrgName?: string | null`.
- When building each stat (lines 308–339 and the player-view equivalent), populate:
  - `groupName: grp?.group_name`
  - `schoolOrOrgName: grp?.schools?.school_name ?? grp?.organizations?.name`
  - `campaignDescription: (campaign as any).description`
- Pass them to `<QRDialog />` (lines 722–738).

**`src/pages/FamilyDashboard.tsx`**
- Extend the campaigns select (line 179) to add `description` and `group_name`/`school_name`/`organizations(name)`.
- Add the same fields to the in-memory campaign objects pushed at line 244.
- Update the `qrTarget` state shape to carry `campaignDescription`, `groupName`, `schoolOrOrgName`, and pass them to `<QRDialog />` (line 908).

**`src/components/PlayerDashboard.tsx`**
- Extend both campaign selects (lines 156 and 350) the same way.
- Extend the `Campaign`/headline shape to carry the three new fields.
- Pass `schoolOrOrgName`, `groupName`, `campaignDescription` to `<QRDialog />` (line 1012).

### 3. PDF layout math (single letter-size page)
- Logo block: unchanged (40pt → ~120pt).
- Title at `titleY = LOGO_BLOCK_BOTTOM + 36`, 28pt bold.
- Description block starts at `titleY + 28`, dynamically sized; QR Y becomes `titleY + 28 + descBlockHeight + 18`.
- QR size: keep at 360pt. If description pushes it past `pageHeight - footer - qrSize - extras`, shrink description to max 3 lines.
- Footer (Powered by + logo) centered at `pageHeight - 40`, logo height ~24pt.

## Out of scope
- Changing the on-screen modal body (still shows "Scan to support {Name} — {Campaign}").
- Any new schema, RLS, or upload flows.
- The PNG-only "Download QR image" output.

## Files touched
1. `src/components/player/QRDialog.tsx` — title/description block, footer "Powered by [logo]", three new optional props.
2. `src/pages/MyFundraising.tsx` — extend selects + state + props.
3. `src/pages/FamilyDashboard.tsx` — extend selects + qrTarget + props.
4. `src/components/PlayerDashboard.tsx` — extend selects + headline + props.

## Verification
- Poster for a school campaign shows e.g. "Support Lincoln High Booster Club" with the campaign description wrapped underneath.
- Poster for a nonprofit campaign shows e.g. "Support Habitat for Humanity Annual Giving" (org name + group name).
- A campaign with an empty description shows the title only and the QR shifts up cleanly.
- Footer reads "Powered by" followed by the small Sponsorly logo, centered at the bottom.
- If the Sponsorly logo can't load, footer falls back to "sponsorly.io" text.

