

# FAQ Page for Marketing Site

## Overview
Create a new `/faq` page following the existing marketing page pattern (MarketingHeader + MarketingFooter). The page will feature a hero section, a category navigation bar at the top with clickable links to anchor sections, and organized Q&A sections using the existing Accordion component.

## Page Structure

```text
+----------------------------------+
|        MarketingHeader           |
+----------------------------------+
|          Hero Section            |
|   "Frequently Asked Questions"   |
+----------------------------------+
|  [Account] [Campaigns] [Payments]|
|  [Teams & Rosters] [Businesses]  |
+----------------------------------+
|  ## Account (anchor: #account)   |
|  > How do I create an account?   |
|  > How do I invite team members? |
|  > Can I manage multiple orgs?   |
|  > How do I reset my password?   |
+----------------------------------+
|  ## Campaigns (anchor: #campaigns)|
|  > What types of campaigns...?   |
|  > How do I create a campaign?   |
|  > What is roster attribution?   |
|  > Can I customize my page?      |
|  > How do I share my campaign?   |
+----------------------------------+
|  ## Payments (anchor: #payments) |
|  > How do supporters pay?        |
|  > When do I receive funds?      |
|  > What payment methods...?      |
|  > Are donations tax-deductible? |
+----------------------------------+
|  ## Teams & Rosters              |
|  > What are rosters?             |
|  > How do personalized URLs work?|
|  > Can parents track progress?   |
|  > How do I manage guardians?    |
+----------------------------------+
|  ## For Businesses               |
|  > How can businesses sponsor?   |
|  > What is the Donor Portal?     |
|  > Can businesses upload assets? |
|  > How does matching work?       |
+----------------------------------+
|  CTA: Still have questions?      |
|  [Contact Us]                    |
+----------------------------------+
|        MarketingFooter           |
+----------------------------------+
```

## Categories (5 total, 4-5 questions each)
1. **Account** - Registration, invitations, password, multiple orgs
2. **Campaigns** - Types, creation, roster attribution, sharing
3. **Payments** - Stripe, payouts, methods, tax receipts
4. **Teams & Rosters** - Roster setup, personalized URLs, family dashboard
5. **For Businesses** - Sponsorship, donor portal, asset uploads, matching

## Technical Details

### New Files
- `src/pages/FAQ.tsx` - The FAQ page component

### Modified Files
- `src/App.tsx` - Add route: `<Route path="/faq" element={<FAQ />} />`
- `src/components/MarketingFooter.tsx` - Add "FAQ" link under the Support column

### Implementation Details
- Uses existing `MarketingHeader`, `MarketingFooter`, `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` components
- Category nav uses `<a href="#category-id">` links with `scroll-margin-top` on sections to offset the sticky header
- Each category section has an `id` attribute for anchor linking
- FAQ data is defined as a typed array within the component for easy future editing
- Responsive: category chips wrap on mobile, accordion is full-width
- Includes Helmet for SEO meta tags
- Bottom CTA links to `/contact`

