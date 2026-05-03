## Goal

Build a polished `PledgeLanding` template for pledge campaigns matching the attached mockup, mirroring the structure of `SponsorshipLanding` and `DonationLanding`. Replace the current minimal `PledgePurchaseFlow` UI on `/c/:slug` for pledge campaigns.

## What gets built

### 1. New file: `src/components/campaign-landing/pledge/PledgeLanding.tsx`
Full-page template, structured like `DonationLanding`:

- **Dark hero** (reuses pattern + `StatTile`/`formatHeadline` from `landingHelpers`)
  - Pledge badge + "Counting now" status pill + group/school location
  - Big serif-italic-accented headline (`hero_accent_word`)
  - Description
  - Raised total (large serif italic) + count of pledgers + progress bar to goal
  - 4-stat grid: Pledged so far, Pledgers, Avg per unit, Game day (event date with "in N days")
- **Two-column main**
  - **Left column**:
    - Roster pitch card (when `attributedRosterMember` present), same pattern as DonationLanding (photo, "You're pledging for", message, video). Show pledger-specific stats footer (their pledger count, avg per unit, projected total) when participant scope.
    - "Make a pledge — Pick a player. Pick an amount." card:
      - Participant select (when `pledge_scope === 'participant'` and no roster member in URL) — reuses participant fetch via `get-campaign-roster-members` edge function
      - Amount-per-unit chips from `pledge_suggested_unit_amounts` + custom input with min validation
      - Live calculation tile: `your pledge × avg units/game = estimated total` (serif italic numbers)
      - "Set a maximum total" toggle + cap input
      - Confirmation banner: "Your card won't be charged until after {eventDate}."
    - "The leaderboard" — top pledgers list (rank, initials avatar, name, $/unit + scope, est total). Highlights "Your pledge" row when current selection is valid.
  - **Right column** (sticky pledge summary card):
    - Whole team / participant scope label + per-unit price + est units
    - Max cap (or "No cap")
    - Estimated subtotal, Platform fee (10%), Charged after {eventDate}
    - Bold "Est. auth amount"
    - Info note about platform fee when `fee_model === 'donor_covers'`
    - "Continue to checkout" CTA → invokes `create-pledge-setup` edge function (same payload shape as current `PledgePurchaseFlow`) and redirects to Stripe
    - Reassurance: "You'll only be charged for {units} actually made."

### 2. New hook: `src/hooks/useCampaignPledgers.ts`
Fetches pledges + (optional) roster member names for the leaderboard and stat aggregates (count, total estimated raise, avg per unit). Uses existing `pledges` table; aggregates client-side.

### 3. Edit `src/pages/CampaignLanding.tsx`
- Import `PledgeLanding`.
- In the existing pledge branch (currently rendering `PledgePurchaseFlow` inside the legacy hero), render `PledgeLanding` as a top-level template like `DonationLanding`/`SponsorshipLanding` — and skip the legacy hero/pitch wrapper for pledge campaigns (extend the existing `!== 'sponsorship' && !== 'donation'` guard to also exclude `'pledge'`).
- Keep `PledgePurchaseFlow` file in place for now (no behavior risk); the new template owns the flow entirely.

### 4. Shared helpers
No changes — reuses `formatHeadline`, `getDaysLeft`, `getVideoEmbedUrl`, `StatTile` from `landingHelpers.tsx`.

## Data sources used

- `campaigns` (existing pledge_* fields, hero_accent_word, image_url, goal_amount, amount_raised, end_date)
- `pledges` table (status='active') for leaderboard and stats
- `get-campaign-roster-members` edge function (existing) for participant picker
- `create-pledge-setup` edge function (existing) for checkout

No DB migrations needed.

## Out of scope

- Editing the campaign editor for new pledge fields
- Changes to charge-pledges / verify-pledge-setup edge functions
- Refactoring `PledgePurchaseFlow` (left as-is, no longer rendered for pledge type)
