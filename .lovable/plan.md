# Update Default OG Image to JPG

Swap the default Open Graph image reference from `og-default-1200x630.png` to `og-default-1200x630.jpg` (the newly uploaded Sponsorly brand card) everywhere in the codebase, except `cloudflare/worker.js` which you manage separately.

## Files to update

1. **`index.html`** (lines 37, 38, 51) — update three `<meta>` tags:
   - `og:image`
   - `og:image:secure_url`
   - `twitter:image`

2. **`src/components/seo/SeoHead.tsx`** (line 4) — update `DEFAULT_OG_IMAGE` constant.

3. **`supabase/functions/get-page-meta/index.ts`** (line 53) — update `STATIC_OG_IMAGE` constant. (Edge function will be redeployed automatically.)

4. **`supabase/functions/generate-og-image/index.ts`** (line 7) — update `STATIC_OG_IMAGE` constant. (Edge function will be redeployed automatically.)

## Not changing

- `cloudflare/worker.js` — you manage and deploy this outside Lovable.
- The old `public/lovable-uploads/og-default-1200x630.png` file will be left in place (harmless; can be deleted later if desired).

## Result

All Sponsorly default OG image references will resolve to:
`https://sponsorly.io/lovable-uploads/og-default-1200x630.jpg`
