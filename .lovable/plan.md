## Problem

The "Shop open" / "Event live" status pill in the hero uses the brand accent color for both the dot and the text (`text-[hsl(var(--merch-accent))]`). Now that the accent inherits the brand primary, dark brand colors (e.g. the Kentucky Baseball Club's navy) become illegible against the already dark hero background and translucent pill (`bg-white/10`).

## Fix

Drop brand-color text on translucent dark hero pills. The pill is a neutral status chip — its job is legibility, not branding. The brand color stays everywhere else (CTA buttons, progress bar, accent words, card borders, stat highlights), which is where it actually reinforces identity.

### Changes

1. **`MerchandiseLanding.tsx`** (hero, ~line 506–515)
   - Remove the `${accent}` class on the "Shop open / Shop closed" pill.
   - Change the status dot from `${accentBg}` to a neutral indicator: `bg-emerald-400` when open, `bg-white/60` when closed. Open/closed state is communicated by the dot color — not the brand color.
   - Result: both pills become consistent white-text-on-white/10 chips, fully legible regardless of brand color.

2. **`EventLanding.tsx`** (hero status pill, ~line 436)
   - The pill currently uses `${accentBg} text-white`. On a light brand color (e.g. yellow/gold) white text on the brand background becomes unreadable.
   - Replace with the same neutral hero-pill style used in Merchandise: `bg-white/10 backdrop-blur border border-white/15 text-white`, with a small `bg-emerald-400` (live) or `bg-white/60` (ended) status dot.

3. **Audit other templates** (`DonationLanding`, `PledgeLanding`, `SponsorshipLanding`)
   - Quick scan for any hero pill / chip that prints brand-colored text on a translucent dark surface, or white text on a brand-colored background. Apply the same neutral-chip-with-status-dot pattern wherever found. Brand color stays on CTAs, progress fills, accent headline words, and card highlights.

4. **Leave non-hero usages untouched.** Section borders, CTA buttons, progress bars, stat numbers, italic accent words — these all sit on light/neutral surfaces or rely on brand fills, where contrast is already handled.

### Why not auto-adjust pill background based on brand luminance?

Considered: detect dark brand color → bump pill bg opacity; detect light brand → darken text. Rejected because (a) the hero already has its own dark image overlay, so any brand-tinted pill background fights the hero photo, and (b) a single neutral chip style is more predictable and matches how status indicators work elsewhere in the app. Brand identity in the hero is carried by the logo strip (`BrandLogoStrip`), the headline accent word, and the progress bar — which is plenty.

### Files touched

- `src/components/campaign-landing/merchandise/MerchandiseLanding.tsx`
- `src/components/campaign-landing/event/EventLanding.tsx`
- `src/components/campaign-landing/donation/DonationLanding.tsx` (only if a similar hero pill exists)
- `src/components/campaign-landing/pledge/PledgeLanding.tsx` (only if a similar hero pill exists)
- `src/components/campaign-landing/sponsorship/SponsorshipLanding.tsx` (only if a similar hero pill exists)
