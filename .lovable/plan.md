## Update WhoItsFor page to match mockup

Redesign `/who-its-for` so the hero copy and audience grid match the uploaded mockup. Keep the existing final CTA section.

### Hero changes
- Eyebrow chip: `Who Sponsorly is for` (green dot, existing `.sp-chip` style)
- Headline: `Built for the people who` / `*actually do the asking.*` (italic second line, serif display)
- Sub-paragraph: "Coaches, parent volunteers, band directors, robotics mentors, theater parents, executive directors, treasurers, presidents. Sponsorly is the same zero-fee platform tailored for every kind of group that raises."

### Audience grid (7 cards, in this order)
1. Sports Teams → `/schools/sports-teams` (blue, player icon)
2. Booster Clubs → `/schools/booster-clubs` (green, shield icon)
3. PTOs & PTAs → `/schools/pto-pta` (orange, parents icon)
4. Marching Bands → `/schools/marching-bands` (violet, music icon)
5. Academic Clubs → `/schools/academic-clubs` (teal, book/graduation icon)
6. Arts Clubs → `/schools/arts-clubs` (pink, theater/heart icon)
7. Nonprofits → `/nonprofits` (violet, heart icon) — rendered as a **wide** row (full-width, image right ~2/3)

Drop **Local Businesses** from the grid. Short body copy on each card matches mockup tone (1 sentence).

Each card uses existing `.sp-hub-card` styling: pastel icon tile, serif title, body, blue `Explore {title} →` link, photo right side. The `wide` modifier already exists for the Nonprofits row — no CSS changes needed.

### Final CTA
Keep the existing dark `sp-final-cta` section as-is.

### Files to edit
- `src/pages/WhoItsFor.tsx` — update hero copy, replace `audiences` array (7 entries, Nonprofits last with `wide: true`), add SVG paths for graduation cap (academic) and theater/mask (arts) icons.

No new components, no CSS changes, no route changes.
