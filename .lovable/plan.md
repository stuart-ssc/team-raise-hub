# Academic Clubs & Arts Clubs landing pages

Add two new sub-pages of `/schools` matching the supplied mockups, using the same `AudiencePage` template that powers Sports Teams, Booster Clubs, Marching Bands, and PTO/PTA. Wire them into routing, the Schools overview, the header dropdown, and the sitemap.

## Pages to create

### 1. `/schools/academic-clubs` — `src/pages/schools/AcademicClubs.tsx`
- Theme: **accent** (orange/teal hybrid — use `accent` for now; teal would require a new theme. Mockup uses teal, so we'll add a `teal` theme — see Technical section).
- Hero chip: "Built for Academic Clubs"
- Headline: *Fund the trip,* / *the team, the trophy.*
- Sub: "Robotics, Math Team, Science Olympiad, Quiz Bowl, Model UN, DECA. The travel is real, the entry fees are real, the parts budgets are real — and Sponsorly is built for every one of them."
- CTAs: "Start a club fundraiser — free" / "Book a 15-minute walkthrough"
- Micro: Per-student trip ledgers · Sponsor & grant tracking · Coach + parent access
- Hero image: robotics/STEM photo, badge `$12,540` "Raised this season", org "Westview HS Robotics", meta "Team #4126 · 32 members · Worlds bound", bar 84%
- Pillars (3): "Per-student travel ledgers" · "Corporate sponsors that actually renew" · "Grants & STEM funding, organized" (icons: doc/bars/cash)
- Fundraisers (4): "Scholarship funding" · "Tournament travel" · "Corporate sponsorships" · "Camp & clinic scholarships"
- CRM: "The whole roster. The whole rolodex. One screen." — sponsor/donor table with role/trip/lifetime/status columns
- Real campaigns (4): FIRST Worlds travel · Build-season parts & kits · Mock Trial nationals trip · Science Olympiad event kit
- Stats strip (teal gradient): 540+ academic clubs · $14M+ raised · 91% of trips fully funded
- Sister links: Sports Teams, Booster Clubs, Marching Bands, Arts Clubs
- Final CTA: *Fund the season.* / *Fund every kid on the team.*

### 2. `/schools/arts-clubs` — `src/pages/schools/ArtsClubs.tsx`
- Theme: **pink** (new — see Technical section). Mockup uses magenta/pink.
- Hero chip: "Built for Arts Clubs"
- Headline: *Fund the show.* / *From flats to footlights.*
- Sub: "Theater, choir, dance, film, visual arts, literary mag. Every arts program runs on ticket sales, patron gifts, and a budget tied together with hot glue. Sponsorly fixes the budget part."
- CTAs: "Start an arts fundraiser — free" / "See a sample show →"
- Micro: Ticketing & seating · Patron & donor CRM · Royalty-friendly receipts
- Hero image: theater/curtain photo, badge `$28,140`, org "Lincoln HS Theater — Spring Musical", bar 89%
- Pillars (3): "Ticketing & reserved seating, built-in" · "Patron circle & named-gift recognition" · "Show-budget bookkeeping" (icons: ticket/star/doc)
- Fundraisers (4): "Show ticket sales" · "Program-book ad sales" · "Patron drive" · "Gallery night & auction"
- CRM: "Every patron, every ticket, every standing ovation." — patron table
- Real campaigns (4): Spring musical box-office · Patron circle annual drive · Black-box music-fest playlist · Visual arts gallery night
- Stats strip (pink gradient): 480+ arts programs · $12M+ raised for theater & studios · 2.8x patron renewal vs. industry average
- Sister links: Sports Teams, Booster Clubs, Marching Bands, Academic Clubs
- Final CTA: *Curtain up.* / *Fund every show, every season.*

## Wiring

### Routes (`src/App.tsx`)
Add imports + routes (above `/schools/:state` so static segments win):
```tsx
import AcademicClubs from "./pages/schools/AcademicClubs";
import ArtsClubs from "./pages/schools/ArtsClubs";

<Route path="/schools/academic-clubs" element={<AcademicClubs />} />
<Route path="/schools/academic" element={<Navigate to="/schools/academic-clubs" replace />} />
<Route path="/schools/clubs" element={<Navigate to="/schools/academic-clubs" replace />} />
<Route path="/schools/arts-clubs" element={<ArtsClubs />} />
<Route path="/schools/arts" element={<Navigate to="/schools/arts-clubs" replace />} />
<Route path="/schools/theater" element={<Navigate to="/schools/arts-clubs" replace />} />
```

### Schools overview (`src/pages/Schools.tsx`)
Update the two existing tiles (lines 310-311) so they no longer fall back to `/fundraisers`:
- Academic Clubs → `/schools/academic-clubs`
- Arts Clubs → `/schools/arts-clubs`

Also add both to the cross-link grid further down (around line 649).

### Header dropdown (`src/components/MarketingHeader.tsx`)
Add "Academic Clubs" and "Arts Clubs" entries to the existing Schools hover dropdown.

### Sitemap (`public/sitemap-main.xml`)
Add `<url>` entries for both new paths.

### Sister links on existing pages
Update Sports Teams, Booster Clubs, Marching Bands, PTO/PTA, and Nonprofits sister-link lists so 1–2 of them point to the new Academic/Arts pages where it makes sense (keeps the cross-link grid fresh without exceeding 4 items).

## Technical details

### New theme colors (`src/components/audience/audienceStyles.ts`)
The mockups use teal (academic) and magenta/pink (arts) — neither exists today. Add two CSS theme classes alongside the existing four:
```css
.sp-aud.theme-teal { --sp-theme: #0E8A8A; --sp-theme-deep: #0A6F6F; --sp-theme-soft: rgba(14,138,138,0.12); }
.sp-aud.theme-pink { --sp-theme: #D6336C; --sp-theme-deep: #B02659; --sp-theme-soft: rgba(214,51,108,0.12); }
```
And extend the `AudienceTheme` type in `AudiencePage.tsx` to include `"teal" | "pink"`. The existing `EyebrowColor` union (`blue | green | accent | violet`) also needs `teal` and `pink` added, plus the matching `.sp-eyebrow.teal` / `.sp-eyebrow.pink` classes in the stylesheet.

### Stats-strip gradients
- Academic: `linear-gradient(135deg, #0E8A8A 0%, #0A6F6F 100%)`
- Arts: `linear-gradient(135deg, #D6336C 0%, #9D1F4E 100%)`

### Hero images (Unsplash)
- Academic Clubs: `https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=1200&q=80` (robotics)
- Arts Clubs: `https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80` (theater curtain)

### SEO
Each page gets a `<SeoHead>` via the template's `seo` prop. Titles:
- "Sponsorly for Academic Clubs — Fund the trip, the team, the trophy"
- "Sponsorly for Arts Clubs — Fund the show, from flats to footlights"

## Files

**Create**
- `src/pages/schools/AcademicClubs.tsx`
- `src/pages/schools/ArtsClubs.tsx`

**Edit**
- `src/components/audience/AudiencePage.tsx` (extend `AudienceTheme` + `EyebrowColor`)
- `src/components/audience/audienceStyles.ts` (add teal + pink theme blocks and eyebrow variants)
- `src/App.tsx` (routes + redirects)
- `src/pages/Schools.tsx` (tile destinations + cross-link grid)
- `src/components/MarketingHeader.tsx` (Schools dropdown)
- `public/sitemap-main.xml` (two new URLs)
- `src/pages/schools/SportsTeams.tsx`, `BoosterClubs.tsx`, `MarchingBands.tsx`, `PtoPta.tsx`, `src/pages/Nonprofits.tsx` (refresh sister links — minor)
