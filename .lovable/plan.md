## Overview

Replace the small icon-row "sister pages" section on every audience sub-page with the new image-card grid shown in the mockup. Each card shows a hero photo on top, then a bold title, a one-line description, and a colored arrow link. The current page's card is omitted on each page so users only see the *other* programs.

## Card catalog (7 total — current page hides itself)

| Slug | Title | Short description | Image (Unsplash) |
|---|---|---|---|
| `/schools/sports-teams` | Sports Teams | Roster fundraisers, sponsor packages, pledge-per-event campaigns. | soccer-on-grass photo (matches mockup) |
| `/schools/booster-clubs` | Booster Clubs | Tiered sponsor packages, capital campaigns, gala & auction nights. | basketball / athletics action photo |
| `/schools/pto-pta` | PTOs & PTAs | Direct-give campaigns, jog-a-thons, spring auctions, classroom grants. | apple on books / classroom still life |
| `/schools/marching-bands` | Marching Bands | Trip funds, uniform drives, sponsor-an-instrument, concert ticketing. | marching band / brass section photo (NEW card) |
| `/schools/academic-clubs` | Academic Clubs | Robotics, debate, Model UN, FBLA — fund the regional-to-nationals climb. | classroom / kids raising hands |
| `/schools/arts-clubs` | Arts Clubs | Theater, choir, orchestra, dance — production budgets and patron giving. | red-curtain silhouettes |
| `/nonprofits` | Nonprofits | Annual appeals, peer-to-peer events, recurring giving, major-gift CRM. | volunteer / boxes photo |

The Marching Bands card is the new addition — it uses the orange/accent theme color for its arrow to match the existing site palette.

## Visual spec (from the mockup)

- White cards with `~14px` border-radius and a subtle border, sitting on the off-white page background.
- Cover image on top filling the full card width, fixed aspect (~16:10), `object-fit: cover`, no padding.
- Card body: ~24px padding, bold dark title (`~18px`), muted gray one-line subtitle, and a colored right-arrow icon aligned to the bottom-right of the body. The arrow color matches the destination page's theme color (blue for sports/PTOs, green for boosters, orange for bands, teal for academic, pink for arts, violet for nonprofits).
- Layout: 3 columns desktop → 2 columns tablet → 1 column mobile.
- Section heading and subhead unchanged in structure but restyled to match the mockup (centered serif headline, muted subhead, generous top padding).

## Files to change

1. **`src/components/audience/AudiencePage.tsx`**
   - Replace the `SisterLink` interface and the sister-pages JSX block with a new `sisterCards` prop (image, title, body, to, arrowColor).
   - Render the new image-card grid.

2. **`src/components/audience/audienceStyles.ts`**
   - Replace `.sp-sister-grid` / `.sp-sister-link` styles with new `.sp-sister-card` styles (image header, body padding, hover lift, responsive breakpoints).

3. **All 7 audience pages** — swap the existing `sisterLinks` array for a new `sisterCards` array containing the 6 *other* programs (current page omitted):
   - `src/pages/schools/SportsTeams.tsx`
   - `src/pages/schools/BoosterClubs.tsx`
   - `src/pages/schools/PtoPta.tsx`
   - `src/pages/schools/MarchingBands.tsx`
   - `src/pages/schools/AcademicClubs.tsx`
   - `src/pages/schools/ArtsClubs.tsx`
   - `src/pages/Nonprofits.tsx`

   Each page passes only the 6 other cards, in this canonical order: Sports Teams → Booster Clubs → PTOs & PTAs → Marching Bands → Academic Clubs → Arts Clubs → Nonprofits (skipping itself).

## Technical notes

- New prop shape:
  ```ts
  interface SisterCard {
    to: string;
    title: string;
    body: string;
    image: string;       // Unsplash URL
    arrowColor: string;  // hex matching destination theme
  }
  sisterCards: SisterCard[];
  ```
- Remove the now-unused `SisterLink` type and `Icon`-based sister rendering.
- Images are Unsplash URLs with `?w=900&q=80` query params for crisp 2x rendering at card width.
- Section keeps its existing `sisterHeadline` / `sisterSub` props — only the grid below them changes.
- No routing, SEO, or sitemap changes required.