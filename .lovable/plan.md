# Inline Checkout in Sponsorship Right Column + Logo Upload

Currently on a Sponsorship campaign, clicking "Continue to checkout" hides the entire landing page and renders the donor info / business info / custom fields / payment steps in a centered card below. The user wants the whole checkout flow to stay inside the right-column cart card on the landing page, and the placeholder "Upload your business logo" prompt to become a real upload that gets attached to the new business record.

## Scope

Sponsorship-type campaigns only. Other campaign types (donation, merchandise, event, pledge) keep their existing layout.

## 1. Right-column inline checkout

In `src/pages/CampaignLanding.tsx`:
- For sponsorship campaigns, always render `SponsorshipLanding` (regardless of `checkoutStep`) so the hero, pitch, items grid, and sponsor wall stay visible during checkout.
- Stop rendering the centered `<div className="max-w-6xl mx-auto p-6">` checkout cards (donor-info / business-info / custom-fields / payment) when the campaign is sponsorship — those steps move into the sidebar.
- Pass new props down to `SponsorshipLanding`: `checkoutStep`, `setCheckoutStep`, `donorInfo`, `setDonorInfo`, `businessData`, `setBusinessData`, `customFieldValues`, `setCustomFieldValues`, `customFields`, `requiresBusinessInfo`, `organizationId`, `processingCheckout`, `handleDonorInfoNext`, `handleBusinessInfoNext`, `handleCustomFieldsNext`, `handleFinalCheckout`, plus a new `pendingLogoFile` setter for the logo handoff.

In `src/components/campaign-landing/sponsorship/SponsorshipLanding.tsx`:
- Replace the right `<aside>` cart contents with a step-aware panel:
  - `cart` step: existing summary + "Continue to checkout" button.
  - `donor-info` step: render `<DonorInfoForm>` inline with Back/Continue.
  - `business-info` step: render `<BusinessInfoForm>` inline with the logo uploader (see §2) and Back/Continue.
  - `custom-fields` step: render `<CustomFieldsRenderer>` inline with Back/Continue.
  - `payment` step: render a compact review (items, donor, business, totals) + Back/"Pay" button wired to `handleFinalCheckout`, with `processingCheckout` spinner.
- Keep the sticky positioning (`lg:sticky lg:top-6`) and add `max-h-[calc(100vh-3rem)] overflow-y-auto` so long forms scroll inside the card on desktop.
- Remove the disabled placeholder upload block; logo upload now lives inside the business-info step.

## 2. Logo upload tied to business creation

The current right-column card already shows a disabled "Upload your business logo" prompt. Make it real and only show it when the campaign requires business info (i.e. during the `business-info` step).

Approach (no new bucket needed — reuse the existing `avatars` storage bucket already used by `AvatarUpload`, which `BusinessEditor` already uses for business logos):

- Add a new local state `pendingLogoFile: File | null` and `pendingLogoPreview: string | null` in the sidebar.
- In the business-info step, render an upload control above `BusinessInfoForm`:
  - If no file selected: dashed dropzone with "Upload PNG / SVG" button.
  - If selected: thumbnail + "Replace" / "Remove".
  - Just stores the `File` locally; no upload yet.
- Extend `BusinessInfoForm` with two optional props:
  - `logoFile?: File | null`
  - `onLogoUploaded?: (logoUrl: string | null) => void` (used internally after business creation).
- In `BusinessInfoForm.handleCreateBusiness`, after `process-checkout-business` returns the `businessId`, if `logoFile` is set:
  1. Upload the file to the `avatars` bucket at `${businessId}/logo-${Date.now()}.${ext}`.
  2. Get its public URL.
  3. Call a new edge function `update-business-logo` (or extend `process-checkout-business` to accept `logoUrl`) that uses the service role to `UPDATE businesses SET logo_url = ... WHERE id = businessId`. Service role is required because the unauthenticated checkout flow can't update `businesses` directly via RLS.
  4. Surface failure as a non-blocking toast (checkout still proceeds).
- For the existing-business "select" path (`handleSelectBusiness`), if a logo file was provided and the matched business has no `logo_url`, perform the same upload + update. If it already has one, skip and show a small note "This business already has a logo on file."

Decision: extend `process-checkout-business` rather than add a new function — it already runs with the service role and is invoked at the right moment. Add an optional `logoUrl` field to its body and have it run an UPDATE on `businesses` when present (only setting the column if currently null, to avoid overwriting an admin-curated logo).

## 3. Visibility rules

- Logo uploader appears only when `campaign.requires_business_info` is true and `checkoutStep === 'business-info'`.
- For non-sponsorship campaigns, behavior is unchanged.

## Technical Notes

Files to edit:
- `src/pages/CampaignLanding.tsx` — pass checkout state into `SponsorshipLanding`, drop the centered checkout cards for sponsorship campaigns.
- `src/components/campaign-landing/sponsorship/SponsorshipLanding.tsx` — render step-aware sidebar with `DonorInfoForm`, `BusinessInfoForm`, `CustomFieldsRenderer`, review, and the new logo uploader.
- `src/components/BusinessInfoForm.tsx` — accept `logoFile` prop, upload to `avatars` bucket after business creation, pass `logoUrl` to the edge function.
- `supabase/functions/process-checkout-business/index.ts` — accept optional `logoUrl`; update `businesses.logo_url` (only when currently null) for both newly created and matched businesses.

Storage: reuse existing `avatars` public bucket (already used for business logos in `BusinessEditor`). No new migration needed.

No DB schema changes — `businesses.logo_url` already exists.
