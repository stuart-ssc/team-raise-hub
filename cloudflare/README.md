# Cloudflare Worker — Social Share Prerender

This Worker fixes Open Graph / Twitter Card previews when Sponsorly pages are
shared on Facebook, LinkedIn, iMessage, Slack, Discord, Twitter, etc.

## Why it exists

Sponsorly is a single-page React app. Social crawlers download the initial
HTML and never run JavaScript, so they only see the static `<head>` in
`index.html` — they never see the per-page `<title>` and OG tags that
`react-helmet-async` injects at runtime.

This Worker sits in front of the site on Cloudflare and:

- Detects social-media crawler User-Agents.
- Calls the `get-page-meta` Supabase Edge Function to look up per-page
  metadata (campaign name, school name, OG image, etc.).
- Returns the SPA HTML with `<title>`, description, canonical, OG, and
  Twitter tags rewritten in.
- Real users (regular browsers) pass through untouched. Zero perf impact.

## One-time deploy (≈ 5 minutes)

1. Open the Cloudflare dashboard → **Workers & Pages** → **Create**.
2. Choose **Create Worker** → name it `sponsorly-social-meta` → **Deploy**
   (deploys a placeholder).
3. Click **Edit code**, delete the placeholder, paste the entire contents
   of [`cloudflare/worker.js`](./worker.js), and **Save and deploy**.
4. From the Worker page, click **Settings → Triggers → Add Route**, and
   add these routes (zone: `sponsorly.io`):
   - `sponsorly.io/*`
   - `www.sponsorly.io/*`
5. (Recommended) Under **Settings → Variables**, no env vars are needed —
   the endpoint is hard-coded in the script.

## Updating the Worker later

Two options:

- **Dashboard**: open the Worker → Edit code → paste the new contents of
  `worker.js` → Save and deploy.
- **Wrangler CLI**: from this directory, `npx wrangler deploy worker.js`
  (requires `wrangler login` once).

## Verifying it works

After deploy, run from your terminal:

```bash
# Should return rewritten HTML with the campaign title in <title> and og:title
curl -A "facebookexternalhit/1.1" https://sponsorly.io/c/some-campaign-slug | grep -E '(og:title|<title>)'

# Should return the standard SPA HTML untouched (no X-Sponsorly-Prerender header)
curl -I -A "Mozilla/5.0" https://sponsorly.io/c/some-campaign-slug
```

Then validate with the official tools:

- Facebook Sharing Debugger — https://developers.facebook.com/tools/debug/
- Twitter Card Validator — https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector — https://www.linkedin.com/post-inspector/

If a crawler ever sees a stale preview, click "Scrape Again" / "Inspect" to
force a refresh.

## Cost

Cloudflare Workers free tier includes 100,000 requests/day. Crawler traffic
is a tiny fraction of total site traffic, and real-user requests skip the
Worker logic entirely (immediate `fetch(request)` passthrough). Expected
cost: **$0/month**.