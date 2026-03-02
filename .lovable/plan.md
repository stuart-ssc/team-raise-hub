

# Fix: Update All Email Sender Addresses to Verified Domain

## Problem
All 6 email-sending edge functions use `Sponsorly <onboarding@resend.dev>` (Resend's sandbox address), which only allows sending to your own email. Your domain `sponsorly.io` is already verified in Resend, so we just need to update the sender address.

## Changes
Update `from: "Sponsorly <onboarding@resend.dev>"` to `from: "Sponsorly <noreply@sponsorly.io>"` in all 6 files:

| File | Current | New |
|------|---------|-----|
| `supabase/functions/send-donation-confirmation/index.ts` | `onboarding@resend.dev` | `noreply@sponsorly.io` |
| `supabase/functions/send-parent-donation-notification/index.ts` | `onboarding@resend.dev` | `noreply@sponsorly.io` |
| `supabase/functions/send-campaign-milestone/index.ts` | `onboarding@resend.dev` | `noreply@sponsorly.io` |
| `supabase/functions/send-test-email/index.ts` | `onboarding@resend.dev` | `noreply@sponsorly.io` |
| `supabase/functions/bulk-email-donors/index.ts` | `onboarding@resend.dev` | `noreply@sponsorly.io` |
| `supabase/functions/bulk-email-businesses/index.ts` | `onboarding@resend.dev` | `noreply@sponsorly.io` |

## Additional Fixes (from earlier errors)

### send-donation-notification: "Campaign not found"
The function queries `campaigns` with a join to `groups`, but the `groups` relationship may return an array instead of a single object. Will update to handle the array format (same pattern used in `send-donation-confirmation`).

### send-parent-donation-notification: "column orders.roster_member_id does not exist"
The function references `roster_member_id` on the `orders` table, but the column doesn't exist. Will check the actual schema and update to use the correct column name (likely from `roster_member_campaign_links` or the order metadata).

## Impact
- Stuart's confirmation email will be re-sendable once deployed
- All future emails will send from `noreply@sponsorly.io` and actually reach recipients
- The two broken notification functions will stop throwing errors
