

## Goal
Redesign the Player/Student view in `PlayerDashboard.tsx` to match the uploaded Sponsorly Player Dashboard mockup. Apply Sponsorly branding (white surfaces, primary blue `#1c6dbe`, no gradients, solid CTAs). Keep all existing data fetching unchanged.

> Note on mockup: the mockup includes gamification elements (XP, level, streaks, badges, pitch video, daily quests, "next milestones") that aren't in our schema. I'll implement everything we can power with real data and stub the gamification visuals only where the calculation is trivial (e.g., "↑ up from #X" we can't compute without history — so it's omitted). Anything purely decorative without data is dropped to avoid fake numbers.

## New layout (player branch only)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ HERO CARD — dark navy bg (sidebar color), white text                  │
│ "Good morning, {FirstName}"                                            │
│ Headline: "You're $X away from passing {NextPlayer}." (or generic)     │
│ ┌─────────────┬─────────────┬─────────────┐  ┌──────────────────────┐ │
│ │ MY RAISED   │ TEAM RANK   │ SUPPORTERS  │  │ PLAYER CARD          │ │
│ │ $1,261      │ #3 / 18     │ 17          │  │ Initials avatar      │ │
│ │ from N camp │ on {team}   │ unique      │  │ {Full Name}          │ │
│ └─────────────┴─────────────┴─────────────┘  │ {ROLE} · {TEAM}      │ │
│                                              └──────────────────────┘ │
│ [Share my link] CTA (white button, navy text)                          │
└────────────────────────────────────────────────────────────────────────┘

YOUR HEADLINE CHALLENGE
(highest-priority attributed campaign — first roster-attribution campaign)
┌────────────────────────────────────────────────────────────────────────┐
│ [Roster Challenge] [N days left] [Ends …]      TEAM POT $X / $Y       │
│ {Campaign Name}                                  ▓▓▓▓▓▓▓░░░ progress  │
│ {description / tagline}                                                │
│ ┌─────────────────────────────────────┐ ┌──────────────────────────┐  │
│ │ MY PERSONAL GOAL                    │ │ TEAM LEADERBOARD         │  │
│ │ $280 of $1,000 — 28% bar            │ │ #1 Jordan Rivera $2,140  │  │
│ │ axis: $0 $250 $500 $750 $1,000      │ │ #2 Casey Morgan  $1,620  │  │
│ │                                     │ │ #3 Taylor Park YOU $1,285│  │
│ │ YOUR PERSONAL LINK                  │ │ #4 Avery Chen   $1,140   │  │
│ │ sponsorly.io/c/.../tp11  [Copy][Sh] │ │ #5 Riley Stokes $980     │  │
│ │ [Text][Story][TikTok][FB][Email]    │ │ "$X separates you from #N│  │
│ └─────────────────────────────────────┘ └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘

OTHER CAMPAIGNS
(grid of remaining campaigns — attributed first, then team-only)
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ {Name}     [N days left]     │  │ {Name}     [N days left]     │
│ ROSTER CHALLENGE / TEAM      │  │                              │
│ MY PROGRESS or TEAM PROGRESS │  │                              │
│ progress bar + amounts       │  │                              │
│ personal link if attributed  │  │ [Copy team link] [Share]     │
│ [QR] [Share]                 │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘

ManageGuardiansCard (existing, kept at bottom)
```

## Sections — what's powered by real data

| Section | Source |
|---|---|
| Greeting "Good morning/afternoon" + first name | `auth.user` profile |
| MY RAISED | `totalRaisedAll` (sum of attributed) |
| TEAM RANK | `bestRank / totalParticipants` from headline campaign |
| SUPPORTERS | `totalSupportersAll` |
| Headline challenge | First attributed campaign with `enable_roster_attribution` |
| TEAM POT | Headline campaign `amount_raised / goal_amount` |
| MY PERSONAL GOAL bar | `totalRaised / personalGoal` from headline |
| Personal link + Copy/Share | `personalUrl` |
| Social share buttons (Text/Story/TikTok/FB/Email) | Deep links: `sms:`, `mailto:`, FB sharer, X intent (replaces Story/TikTok which have no web share API), WhatsApp |
| Team Leaderboard (top 5 + "See all") | Existing `leaderboard` array |
| Gap line "$X separates you from #N" | Computed from leaderboard |
| Other Campaigns | Remaining `attributedCampaigns` + `currentCampaigns` |

## What I'm NOT building (no data source / keeps surface honest)
- XP / Level rings, badges grid, streaks, "Climbed N spots this week", daily quests, pitch video recorder, "Next milestones" section, "Recent supporters" feed, QR code generation. Drop or stub as static placeholders **only** if you ask for them later.

> If you want any of those, say which and I'll add a follow-up plan (badges + recent supporters are the easiest to power with existing data).

## Styling
- Hero: `bg-sidebar text-sidebar-foreground` (existing dark navy `210 24% 16%`), inner stat cards `bg-white/10` w/ subtle borders, primary CTA white.
- Cards: white, `border`, `shadow-sm`, no gradients.
- Progress: `bg-primary` for personal/team, no rainbow.
- Leaderboard: current user row `bg-primary/5 border-primary/20`, "YOU" badge `bg-primary text-primary-foreground`.
- Status pills (e.g. "Roster Challenge", "31 days left") — Title Case, brand-colored badges.
- Icons 1rem (`h-4 w-4`).
- Mobile: hero stat trio collapses to 1 column, headline challenge stacks personal-link card above leaderboard, other campaigns single column.

## Sharing affordances added
- Copy link, native `navigator.share`.
- Deep links: SMS (`sms:?&body=`), Email (`mailto:`), Facebook sharer, X/Twitter intent, WhatsApp `wa.me`.
- Pre-filled message: *"Help me reach my goal for {Campaign} — every donation counts! {url}"*.

## Files touched
- `src/components/PlayerDashboard.tsx` — replace **only** the player return JSX (lines ~595–866). Parent branch (`isParentView`), data-fetching, `ManageGuardiansCard`, `loading`, and `hasNoCampaigns` blocks remain unchanged. Optionally extract `PlayerHero`, `HeadlineChallenge`, `TeamLeaderboardList`, and `OtherCampaignCard` as inline subcomponents in the same file.

## Out of scope
- Parent (`isParentView`) view restyle.
- Sidebar / header / breadcrumbs.
- New tables, edge functions, schema changes.
- Gamification features without backing data (badges, XP, streaks, pitch video, milestones, recent supporters feed).

