## Update FAQ Text on Pricing Page

Update two FAQ items in `src/pages/Pricing.tsx` to match the new copy.

### Changes

1. **"Can I switch fee mode?"** (line 240-242)
   - Change question from "Can I switch fee modes?" to "Can I switch fee mode?"
   - Update answer to: "Yes. The setting is per fundraiser. Some fundraisers it makes sense to absorb the fee (donor pays a clean $100, you net ~$90); most have donors cover it (donor pays $110, you net $100)."

2. **"How do payouts work?"** (line 248-250)
   - Update answer to: "Funds are deposited directly to your organization's bank account through Stripe, typically in 2 business days. You can view every donation and payout in your Sponsorly dashboard. You can also confirm all transactions in your Stripe dashboard as well."

### Technical Details
- File: `src/pages/Pricing.tsx`
- Simple text replacements in the `faqs` array (lines 234-267)