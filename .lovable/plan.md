## Update Pricing Page SEO Meta Tags

### Summary
Add SEO meta tags to the Pricing page using react-helmet-async to match the requested format.

### Changes Required

**File: `src/pages/Pricing.tsx`**

1. **Import Helmet** from react-helmet-async
2. **Add Helmet component** at the top of the page with:
   - Title: "Pricing | Sponsorly - 100% Free Fundraising for School Sports, Clubs, and PTOs"
   - Meta description: Updated to reflect pricing page content
   - Canonical URL: https://sponsorly.io/pricing
   - Open Graph tags for social sharing
   - Twitter Card tags

### Technical Details

```tsx
import { Helmet } from 'react-helmet-async';

// Inside component return:
<Helmet>
  <title>Pricing | Sponsorly - 100% Free Fundraising for School Sports, Clubs, and PTOs</title>
  <meta name="description" content="Sponsorly is 100% free for schools, sports teams, clubs, and PTOs. No monthly fees, no setup costs. Only a small platform fee per donation that donors can cover." />
  <link rel="canonical" href="https://sponsorly.io/pricing" />
  <meta property="og:title" content="Pricing | Sponsorly - 100% Free Fundraising for School Sports, Clubs, and PTOs" />
  <meta property="og:description" content="Sponsorly is 100% free for schools, sports teams, clubs, and PTOs. No monthly fees, no setup costs." />
  <meta property="og:url" content="https://sponsorly.io/pricing" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Pricing | Sponsorly - 100% Free Fundraising for School Sports, Clubs, and PTOs" />
  <meta name="twitter:description" content="Sponsorly is 100% free for schools, sports teams, clubs, and PTOs. No monthly fees, no setup costs." />
</Helmet>
```

### Verification
After implementation, verify the meta tags are correctly rendered by:
1. Viewing page source in browser
2. Checking the `<title>` tag shows "Pricing | Sponsorly - 100% Free Fundraising for School Sports, Clubs, and PTOs"
3. Confirming meta description and OG tags are present