# New Customer-Type Marketing Pages

Build a new "Who's it for?" hub page, four `/schools` sub-pages, and redesign the Nonprofits page using the mockups in `Sponsorly-Customer-Type-Pages.zip` and the established 2026 marketing redesign style (cream paper background `#FAFAF7`, Sponsorly blue `#1F5FE0`, serif italic accents, rounded buttons, large hero cards) already used on Platform, Fundraisers, Pledge, and Roster pages.

## Pages & Routes

| Page | Route | New file |
|---|---|---|
| Who's it for? (hub) | `/who-its-for` | `src/pages/WhoItsFor.tsx` |
| Sports Teams | `/schools/sports-teams` | `src/pages/schools/SportsTeams.tsx` |
| Booster Clubs | `/schools/booster-clubs` | `src/pages/schools/BoosterClubs.tsx` |
| Marching Bands | `/schools/marching-bands` | `src/pages/schools/MarchingBands.tsx` |
| PTO & PTA | `/schools/pto-pta` | `src/pages/schools/PtoPta.tsx` |
| Nonprofits (redesign) | `/nonprofits` (existing) | `src/pages/Nonprofits.tsx` (rewrite) |

## Implementation Steps

1. **Extract the mockup zip** — copy `user-uploads://Sponsorly-Customer-Type-Pages.zip` into `/tmp`, unzip, and read each HTML mockup so each new React page mirrors its sections, copy, imagery placement, stat blocks, and CTAs.
2. **Build the "Who's it for?" hub** at `/who-its-for`:
   - Hero introducing the audience-segmented experience.
   - 6 audience cards (Sports Teams, Booster Clubs, Marching Bands, PTO/PTA, Nonprofits, Businesses) each linking to its detail page.
   - Supporting sections (shared platform benefits, testimonial strip, final CTA) per the mockup.
3. **Create 4 schools sub-pages** under `src/pages/schools/`. Each follows the same template structure as the mockup:
   - Hero with audience-specific headline + dashboard/preview mock.
   - Pain-points → Sponsorly solution grid.
   - Audience-relevant fundraiser type recommendations (linking to `/fundraisers/...`).
   - Feature highlights, testimonial, and final CTA.
4. **Redesign Nonprofits page** to match the new mockup — replace the current Tailwind primary/accent palette usage with the 2026 cream/blue paper system, restructure hero, program grid, role-based sections (ED / Program Director / Board), and CTA to mirror the redesigned mockup. Keep existing route, `<SeoHead />`, and `<MarketingHeader />` / `<MarketingFooter />` wrappers.
5. **Wire routes in `src/App.tsx`** for the 5 new pages plus a friendly alias `/schools/sports`, `/schools/boosters`, `/schools/band`, `/schools/pto` redirecting to canonical URLs.
6. **Update navigation** in `src/components/MarketingHeader.tsx`:
   - Replace the single `Schools` link with a hover/click dropdown listing: Sports Teams, Booster Clubs, Marching Bands, PTO & PTA, plus a "Schools overview" link to `/schools`.
   - Add a top-level `Who's it for` link before `Fundraisers` (or as a sibling under a "Solutions" grouping, matching existing Platform dropdown pattern).
   - Mirror the new structure in the mobile menu.
7. **Cross-link**:
   - From `/schools` overview, add a tile/grid linking to each new schools sub-page.
   - From each sub-page, add "See other school types" footer cards.
   - From Nonprofits page, add a small "Explore other audiences" link to `/who-its-for`.
8. **SEO**: Each new page gets `<SeoHead />` with unique title, description, canonical path, and OG metadata tuned to the audience (e.g. "Sponsorly for Sports Teams — Team Fundraising That Works").
9. **Sitemap**: Append the 5 new public URLs to `public/sitemap-main.xml`.

## Design System Conventions (reuse from Pledge/Roster/Platform)

- Background: `#FAFAF7` paper, sections alternated with subtle off-white/blue tint blocks.
- Primary blue: `#1F5FE0` (CTA), darker hover `#0B3FB0`.
- Headings: serif italic accent words (e.g. `<span className="font-serif italic">team</span>`) per existing pattern.
- Cards: `rounded-3xl border border-black/[0.06] bg-white shadow-[0_10px_40px_-20px_rgba(10,15,30,0.15)]`.
- Buttons: rounded-full pill style matching `MarketingHeader` CTA.
- Use Lucide icons consistent with other marketing pages.

## Technical Notes

- All new pages are client-only React components using `MarketingHeader`, `MarketingFooter`, `SeoHead`, and `Helmet`.
- Place the 4 schools pages in a new `src/pages/schools/` directory for clarity.
- No backend, schema, or data changes required — these are static marketing pages.
- Keep `/nonprofits` route unchanged so existing inbound links and the sitemap entry continue to work.
- Ensure `MarketingHeader` dropdown is keyboard-accessible (matches pattern used by the existing Platform dropdown if present; otherwise use Radix `NavigationMenu` already available via shadcn).

## Out of Scope

- No changes to dashboard or authenticated routes.
- No new images generated; mockup imagery will be approximated with existing illustrations / Unsplash-style placeholders already used on similar marketing pages, unless the mockup HTML embeds specific image URLs we can reuse.
