# Fix social sharing previews via Cloudflare Worker — $0 added cost

## Approach

Use a **Cloudflare Worker** (free tier: 100k requests/day, plenty for crawler traffic) running on your existing Cloudflare zone for `sponsorly.io`. The Worker intercepts every request, detects social-crawler User-Agents, fetches per-page metadata from a Supabase Edge Function, and returns rewritten HTML with proper Open Graph / Twitter Card tags. Real users pass straight through to the origin untouched.

Stack used (all already paid-for):
- Cloudflare Workers (free tier — already have Cloudflare)
- Supabase Edge Functions (already free in your plan)
- `react-helmet-async` (already installed)

No Netlify, no Prerender.io, no SSR migration, no new accounts.

---

## Part 1 — Cloudflare Worker for crawler prerender (the critical fix)

### How it works

1. Worker runs on a route like `sponsorly.io/*`.
2. Inspects `User-Agent`. If it doesn't match a known social crawler → `fetch(request)` (passthrough — zero impact on real users).
3. If it IS a crawler:
   - Calls the existing/expanded `get-page-meta` Supabase Edge Function with the request path.
   - Fetches `https://sponsorly.io/index.html` from origin (cached at the edge).
   - String-replaces `<title>`, description, canonical, OG, and Twitter tags with page-specific values.
   - Returns rewritten HTML with `Cache-Control: public, max-age=300, s-maxage=300`.

### Worker code outline

A single `worker.js` file (~80 lines) committed to the repo at `cloudflare/worker.js` for version control. You deploy it once via Cloudflare dashboard (Workers → Create → paste code → set route `sponsorly.io/*`). After that, any updates: paste new code into the dashboard or use `wrangler deploy` if you prefer.

Crawler User-Agent matchers: `facebookexternalhit`, `Facebot`, `Twitterbot`, `LinkedInBot`, `Slackbot`, `Slack-ImgProxy`, `Discordbot`, `WhatsApp`, `TelegramBot`, `Applebot`, `Pinterest`, `redditbot`, `Embedly`, `quora link preview`, `SkypeUriPreview`, `vkShare`, `W3C_Validator`, `Googlebot` (Googlebot also benefits from prerendered meta).

I'll also provide a one-page "deploy this Worker" instruction: copy `cloudflare/worker.js` → Cloudflare dashboard → Workers & Pages → Create Worker → paste → save → add route `sponsorly.io/*` and `*.sponsorly.io/*`.

---

## Part 2 — Per-route metadata (expand existing `get-page-meta`)

Extend `supabase/functions/get-page-meta/index.ts` (currently only handles `/schools/:state`, `/schools/:state/:slug`, `/districts/:state/:slug`) to also handle:

- `/` — homepage
- `/c/:slug` — pulls `campaigns` row (name, description, image_url) joined with `groups → schools/organizations`. Title: `Support {Group Name} | {Campaign Name} – Sponsorly`. Image: `campaigns.image_url` (absolute) or branded fallback.
- `/c/:slug/:rosterMemberSlug` — adds roster member name to title when available.
- `/g/:orgSlug/:groupSlug`, `/o/:orgSlug` — pulls org/group, uses logo if present.
- `/fundraisers` and `/fundraisers/{type}` — curated static titles per the user's spec.
- All static marketing routes (`/pricing`, `/faq`, `/platform`, `/who-its-for`, `/schools`, `/nonprofits`, `/for-businesses`, `/features`, `/contact`, `/privacy`, `/terms`) — curated titles/descriptions.
- Default fallback for unmatched routes.

All `og:image` URLs returned will be **absolute**, **1200×630**, with `og:image:width`, `og:image:height`, `og:image:alt`, `og:site_name=Sponsorly`, `twitter:card=summary_large_image`.

---

## Part 3 — Default brand OG image (fix the cropped logo)

The current default `Sponsorly-Logo.png` isn't 1200×630, so Facebook/LinkedIn crop it badly.

- Create a 1200×630 brand card (Sponsorly logo + tagline on brand background) committed to `public/lovable-uploads/og-default-1200x630.png`.
- Update `index.html`, `SeoHead.tsx`, `get-page-meta`, and `generate-og-image` to point at it.

---

## Part 4 — Per-page React `<SeoHead>` coverage

Even though Part 1 handles social crawlers, Google's JS rendering and real users benefit from per-page meta in the React tree. Add `<SeoHead>` to:

- `src/pages/Index.tsx` (verify; add if missing)
- `src/pages/CampaignLanding.tsx` — derive from loaded campaign data
- `src/pages/PublicHub.tsx` — org/group hub
- Any marketing page currently missing it

Extend `<SeoHead>` to emit `og:image:width`, `og:image:height`, `og:image:alt`, and a `noIndex` prop for auth/dashboard pages.

---

## Part 5 — Validation

After Worker is deployed:
1. `curl -A "facebookexternalhit/1.1" https://sponsorly.io/c/{slug}` → confirm rewritten meta in HTML.
2. `curl -A "Mozilla/5.0" https://sponsorly.io/c/{slug}` → confirm normal SPA HTML (no regression).
3. Run Facebook Sharing Debugger, Twitter Card Validator, LinkedIn Post Inspector against homepage, a campaign, a school page, a district page, and `/fundraisers`.

---

## Files to create

- `cloudflare/worker.js` — Worker source (you'll deploy via Cloudflare dashboard)
- `cloudflare/README.md` — step-by-step deploy instructions (5 minutes, one-time)
- `public/lovable-uploads/og-default-1200x630.png`
- `supabase/functions/social-meta-html/` — **NOT NEEDED** (Worker calls `get-page-meta` directly)

## Files to modify

- `index.html` — point to new 1200×630 default, add image dimension tags
- `src/components/seo/SeoHead.tsx` — add width/height/alt + `noIndex`
- `supabase/functions/get-page-meta/index.ts` — add campaign, hub, fundraisers, marketing routes; absolute images + dimensions
- `supabase/functions/generate-og-image/index.ts` — redirect to new 1200×630 asset
- `src/pages/CampaignLanding.tsx`, `PublicHub.tsx`, `Index.tsx`, plus any marketing page missing `<SeoHead>`

## What you'll do manually (one time, ~5 min)

After I push the code:
1. Open Cloudflare dashboard → Workers & Pages → Create Worker.
2. Paste contents of `cloudflare/worker.js`.
3. Save & Deploy.
4. Add route: `sponsorly.io/*` (and `www.sponsorly.io/*` if used).

That's it. Future updates to the Worker = paste new code + Save.

## Cost summary

- Cloudflare: $0 (free Workers tier covers far more than crawler traffic).
- Supabase: $0 added (Edge Functions already included).
- No new vendors or accounts.
