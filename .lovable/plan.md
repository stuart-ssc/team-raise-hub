## Goal

Allow campaign owners to share a private preview link for unpublished fundraisers using `?preview=TOKEN`. Show a banner and disable checkout while in preview mode. Update the editor's Share card to surface the preview URL when not yet published.

## Background

- `campaigns` already has a `preview_token uuid` column.
- The current public SELECT RLS policy only exposes campaigns with `status = true`, so unpublished campaigns can't be fetched from the browser even if you know the token.
- `CampaignLanding.tsx` fetches via `.eq("status", true).single()` and renders the cart with a "Proceed to Checkout" button (around lines 213–231 and 1286–1292).
- `CampaignShareCard` builds `/c/{slug}` and is passed `isPublished` from `CampaignEditor.tsx`.

## Plan

### 1. Public preview fetch (edge function)

Create `supabase/functions/get-campaign-preview/index.ts` (uses service role, no JWT verification):

- Input: `{ slug, previewToken }`.
- Looks up the campaign by `slug` and verifies `preview_token = previewToken`. Returns 404 if not matched.
- Returns the same shape currently selected in `fetchCampaignData` (campaign + groups/group_type/schools + campaign_type), plus `campaign_items` (with `campaign_item_variants`) and `campaign_custom_fields`.
- Register in `supabase/config.toml` with `verify_jwt = false`.

This avoids loosening RLS on the `campaigns` table.

### 2. CampaignLanding preview mode

In `src/pages/CampaignLanding.tsx`:

- Read `preview` from `useSearchParams()`. Track `isPreview = !!previewToken`.
- In `fetchCampaignData`:
  - If `isPreview`: call `supabase.functions.invoke('get-campaign-preview', { body: { slug, previewToken } })`. Populate `campaign`, `campaignItems`, `customFields` from the response. On 404, show "Preview link is invalid or has expired."
  - Else: existing path (unchanged, still requires `status = true`).
- Render a non-dismissible banner at the very top of the page (above the hero) when `isPreview`:
  - Use `Alert` with a lock icon and the exact copy:  
    `🔒 You're viewing an unpublished preview of this fundraiser. This link is private and will stop working once the campaign is published or the token is rotated.`
  - Sticky to the top, amber/warning styling, no close button.
- Disable checkout when `isPreview`:
  - Pass `disabled={isPreview}` (and a tooltip "Checkout is disabled in preview mode") to the cart's "Proceed to Checkout" button at line ~1286.
  - Also short-circuit `handleProceedToCheckout` and `handleDonationProceed` to no-op with a toast in preview mode (defense in depth for the type-specific landings that have their own CTAs).
  - For the type-specific landings (`MerchandiseLanding`, `EventLanding`, `DonationLanding`, `PledgeLanding`, `SponsorshipLanding`), forward an `isPreview` prop and disable their primary CTA buttons similarly. (Each already accepts `onProceedToCheckout`; we add a `disabled` prop and surface the same tooltip.)

### 3. Editor Share card

`src/components/campaign-editor/CampaignShareCard.tsx`:

- Accept new optional prop `previewToken: string | null`.
- When `!isPublished && previewToken && slug`, build URL as  
  `https://sponsorly.io/c/{slug}?preview={previewToken}`  
  (instead of `window.location.origin`, per the requirement to use the canonical sponsorly.io domain for share).
- Update the helper text: when unpublished, say "Private preview link — works until you publish or rotate the token." instead of the current "Link will activate when published."
- Keep Copy / Preview / Share buttons functional with this URL.

`src/pages/CampaignEditor.tsx`:

- Read `preview_token` from the campaign record (already selectable; add to the campaign query if missing).
- Pass `previewToken={campaignData.previewToken}` to `<CampaignShareCard>`.

### 4. Edge cases

- If `?preview=` is present but campaign is already published, the edge function still returns it; banner still shows so the owner knows they're using a private URL. (Acceptable; alternative is to redirect to the clean `/c/{slug}`, but keeping the banner is simpler and matches the requirement.)
- Search engines: keep `noindex` for preview views by adding `<SeoHead noIndex />` (or equivalent meta) when `isPreview`.

## Files touched

- New: `supabase/functions/get-campaign-preview/index.ts`
- Edit: `supabase/config.toml` (register function, `verify_jwt = false`)
- Edit: `src/pages/CampaignLanding.tsx` (preview fetch, banner, disable checkout, propagate `isPreview`)
- Edit: `src/components/campaign-landing/{merchandise,event,donation,pledge,sponsorship}/*Landing.tsx` (accept + apply `isPreview` to CTA)
- Edit: `src/components/campaign-editor/CampaignShareCard.tsx` (preview URL + copy)
- Edit: `src/pages/CampaignEditor.tsx` (pass `previewToken`)

No database migration needed (`preview_token` already exists, RLS untouched).