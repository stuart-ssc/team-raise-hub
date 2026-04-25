## Rebuild Roster Fundraisers page

Rebuild `src/pages/RosterCampaigns.tsx` from scratch to match the uploaded mockup and align with the 2026 redesign style used by the other rebuilt fundraiser pages. Move the URL from `/campaigns/roster` to `/fundraisers/roster` with a redirect for the legacy path.

### Routing & navigation updates

- `src/App.tsx` — add `/fundraisers/roster` as canonical, change `/campaigns/roster` to `<Navigate to="/fundraisers/roster" replace />`.
- `src/pages/CampaignsOverview.tsx` — update both `/campaigns/roster` href references to `/fundraisers/roster`.
- `src/pages/Platform.tsx` — update `<Link to="/campaigns/roster">` to `/fundraisers/roster`.
- `src/components/MarketingFooter.tsx` — update Sports teams link to `/fundraisers/roster`.
- `src/pages/RosterCampaigns.tsx` — update tracking pagePath, document title/meta.

### Page redesign (scoped `.sp-roster`)

Same scoped-CSS pattern as other rebuilt fundraiser pages (Instrument Serif display + Geist UI, brand tokens). Roster's accent palette = **violet `--sp-violet #7B5BE0`** to match the mockup, plus warm cream paper `--sp-paper #FAF7F2`. Italic accent color in headlines is violet.

Sections (top to bottom, mirroring the mockup):

1. **MarketingHeader**.
2. **Hero — split two-column** (cream paper, soft violet/blue radial glows)
   - Left: violet eyebrow "ROSTER FUNDRAISERS", display headline "Gamify giving. Watch your team *compete.*" (violet italic), supporting paragraph ("Give every player, student, or member their own fundraising page — with personal links, a live leaderboard, and team totals. Then watch them go."), primary "Enable roster tracking" + ghost "See a demo" buttons, three checkmark trust items (Personal pages · Live leaderboard · Auto attribution).
   - Right: mock "Team Leaderboard" card titled "Wildcats Football · 22 players" with 4 ranked rows (Jase Martinez gold #1 $1,740, Riley Williams silver #2 $980, Marcus Chen bronze #3 $675, Cara Lindstr-Davis #4 $620), each with progress bar, plus a violet "VIP Member · Jase opened the lead" toast pill.
3. **Everything for peer-to-peer success** (centered, paper-2 alt background)
   - Violet eyebrow "THE TOOLKIT", display headline "Everything for *peer-to-peer* success." (violet italic), copy "Roster campaigns turn the team into the marketing engine. Here's what each player gets.", 3×2 grid of 6 cards: Personal fundraising page, Real-time leaderboard, Video pitches, Personal links, Custom QR codes, Progress tracking. Each card: small icon tile, title, short description.
4. **Player command center — split** (cream)
   - Left: violet eyebrow "PLAYER EXPERIENCE", display headline "Every player gets their own *command center.*" (violet italic), copy "Players log in to a personal dashboard with everything they need to raise — share buttons, recent donations, suggested prospects, and tips for what to do next.", 4-item check list (Personal goals with progress visualizations · One-tap social sharing across every channel · See who donated and thank them in a tap · Smart day-of cues to ride your momentum).
   - Right: mock player dashboard card with violet header (Jake Martinez · #11 Jr · Wildcats Football), large $1,740 with $2,500 goal progress bar, three stat tiles (16 donors / 24 shares / 87% momentum), and Share + QR code buttons.
5. **Personal appeals that convert — split** (paper)
   - Left: mock video card with violet thumbnail (play button center, "0:42" duration, NEW chip top-left), short caption "I'm going to D.C. for nationals — every dollar gets us closer.", attribution row ("Jake M. · 2024-04 · 14,200 views").
   - Right: orange eyebrow "VIDEO APPEALS", display headline "Personal appeals that *convert.*" (orange italic), copy "Donors are 4× more likely to give when they see a player's face. Built-in video pitches turn empathy into action — and let supporters feel personally invested.", 4-item check list (60-second appeals shot directly from phone · Auto-embed at the top of every contact page · Players can record once and re-use · Email previews show full-engaging clip).
6. **Why roster fundraisers work** (centered, paper-2 alt)
   - Violet eyebrow "THE PSYCHOLOGY", display headline "Why *roster fundraisers* work." (violet italic), copy "Peer-to-peer fundraising consistently outperforms team-only campaigns.", 4-card grid (Genuine empathy violet · Extended reach blue · Friendly competition orange · Tactile reciprocity green) with iconography and short blurb each.
7. **The numbers — dark navy band**
   - Centered violet eyebrow "THE NUMBERS", display headline "The numbers speak for *themselves.*" (violet italic), copy "Roster campaigns out-raise team-only fundraisers, every season.", three stat tiles (3× more reach violet · 47% higher participation orange · 2.5× revenue increase green).
8. **Final CTA** (cream/violet glow, centered)
   - Display headline "Ready to *gamify* your fundraising?" (violet italic), copy "Turn your next campaign into a team competition. Enable roster attribution and watch engagement soar.", primary violet "Get started free" + ghost "Explore all fundraiser types" → `/fundraisers`.
9. **MarketingFooter**.

### Technical details

- Single scoped `<style>` block (same pattern as the other rebuilt pages).
- All visuals built with pure CSS + inline SVG icons; no new image assets.
- Update `useLandingPageTracking({ pageType: 'marketing', pagePath: '/fundraisers/roster' })`.
- Update `document.title` to "Roster Fundraisers — Peer-to-Peer Team Fundraising | Sponsorly" and meta description.
- No database, edge function, or schema changes.

### Files to edit

- `src/pages/RosterCampaigns.tsx` (full rewrite)
- `src/App.tsx`
- `src/pages/CampaignsOverview.tsx`
- `src/pages/Platform.tsx`
- `src/components/MarketingFooter.tsx`
