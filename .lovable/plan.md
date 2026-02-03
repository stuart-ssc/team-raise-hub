

# Add Internal Links to New Marketing Pages

## Overview

Several existing marketing pages should link to the recently created campaign-type pages and the For Businesses page to improve discoverability and SEO. This plan adds strategic internal links across the site.

---

## Changes by File

### 1. Marketing Footer (`MarketingFooter.tsx`)

Add a new "Campaigns" column with links to campaign type pages:

```text
Current columns: Product | Company | Get Started
New columns:     Product | Campaigns | Company | Get Started
```

**New links to add:**
- Campaigns Overview (`/campaigns-overview`)
- Sponsorships (`/campaigns/sponsorships`)
- Donations (`/campaigns/donations`)
- Events (`/campaigns/events`)
- Merchandise (`/campaigns/merchandise`)
- For Businesses (`/for-businesses`)

---

### 2. Home Page (`Index.tsx`)

**Location:** Final CTA section (around line 341)

Add a third CTA button for businesses:
- "For Businesses" button linking to `/for-businesses`

**Location:** Features section or after testimonials

Add a "See Campaign Types" link to `/campaigns-overview`

---

### 3. Platform Page (`Platform.tsx`)

**Location:** After the "Key Features Preview" section (around line 276)

Add a new section: "Explore Campaign Types" with links to:
- `/campaigns-overview` (primary CTA)
- `/campaigns/roster` (highlighted as unique feature)

---

### 4. Schools Page (`Schools.tsx`)

**Location:** Within the "Team & Club Features" section or as a new subsection

Add contextual links:
- "See how Roster-Enabled Campaigns work" → `/campaigns/roster`
- "Explore all campaign types" → `/campaigns-overview`

---

### 5. Nonprofits Page (`Nonprofits.tsx`)

**Location:** Within the "Program Director Features" section or as a new subsection

Add contextual links:
- "Donation Campaigns" → `/campaigns/donations`
- "Event Fundraising" → `/campaigns/events`
- "Explore all campaign types" → `/campaigns-overview`

---

### 6. Features Page (`Features.tsx`)

**Location:** Campaign Types section (lines 27-104)

Make each campaign type card clickable with links to corresponding pages:
- Standard Campaigns → `/campaigns-overview`
- Recurring Donations → `/campaigns/donations`
- Peer-to-Peer → `/campaigns/roster`
- Event Fundraising → `/campaigns/events`
- Custom Campaigns → `/campaigns-overview`

---

## Summary Table

| File | New Links Added |
|------|-----------------|
| `MarketingFooter.tsx` | 6 new links (all campaign pages + For Businesses) |
| `Index.tsx` | 2 new links (For Businesses CTA, Campaigns Overview) |
| `Platform.tsx` | 2 new links (Campaigns Overview, Roster Campaigns) |
| `Schools.tsx` | 2 new links (Roster Campaigns, Campaigns Overview) |
| `Nonprofits.tsx` | 3 new links (Donations, Events, Campaigns Overview) |
| `Features.tsx` | 5 clickable campaign type cards |

---

## Technical Notes

- All links use React Router's `Link` component (already imported in all files)
- Maintains consistent styling with existing link patterns
- Footer uses existing column structure pattern
- CTAs follow existing Button styling conventions

