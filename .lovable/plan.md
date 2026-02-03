

# Marketing Content Expansion Plan

## Overview

Based on your outline, I'll create a comprehensive set of new marketing pages that showcase Sponsorly's capabilities to potential customers. These pages will follow the established design patterns from existing marketing pages (using MarketingHeader, MarketingFooter, consistent section styling, and Card components).

---

## New Pages to Create

### 1. Campaigns Overview Page (`/campaigns-overview`)

**Purpose:** Hub page explaining all campaign types and capabilities

**Sections:**
- **Hero:** "Powerful Campaigns for Every Fundraising Need"
- **Campaign Landing Experience:** Custom landing pages with all campaign details, professional design, mobile-optimized
- **E-commerce Checkout:** Familiar shopping experience for supporters, multiple payment methods, simple process
- **Account Management:** Repeat supporters can easily give year after year, saved payment methods, giving history
- **Campaign Types Grid:** Visual overview linking to dedicated pages for each type
- **CTA:** Get started with your first campaign

---

### 2. Sponsorship Campaigns Page (`/campaigns/sponsorships`)

**Purpose:** Dedicated page for business sponsorship campaigns

**Sections:**
- **Hero:** "Turn Local Businesses Into Lasting Partners"
- **What It Is:** Invite businesses to advertise with your group in exchange for supporting your cause
- **Benefits for Organizations:**
  - Create tiered sponsorship packages (Bronze, Silver, Gold, Platinum)
  - Offer advertising placements (banners, jerseys, programs, digital ads)
  - Build ongoing business relationships
  - Professional sponsor recognition displays
- **Benefits for Businesses:**
  - Gain local brand exposure
  - Support community causes authentically
  - Tax-deductible contributions
  - Year-round visibility opportunities
- **Use Cases:** Stadium signage, jersey sponsors, event naming rights, program book ads, digital screen displays
- **How It Works:** Create packages, share with businesses, businesses select and pay, assets collected automatically
- **CTA:** Start building your sponsor program

---

### 3. Donation Campaigns Page (`/campaigns/donations`)

**Purpose:** Explain straightforward donation campaigns

**Sections:**
- **Hero:** "Make Giving Easy with Direct Donation Campaigns"
- **What It Is:** Accept one-time or recurring donations from individuals and businesses
- **Key Features:**
  - One-time donations with suggested amounts
  - Recurring monthly giving programs
  - Automatic tax receipt generation
  - Donor wall/recognition options
  - Goal tracking and progress visualization
  - Anonymous giving option
- **Recurring Giving Spotlight:**
  - Build sustainable funding
  - Predictable monthly revenue
  - Easy donor management
  - Automated reminders and thank-yous
- **Best For:** Annual funds, capital campaigns, emergency appeals, monthly giving programs
- **CTA:** Launch your donation campaign

---

### 4. Event Campaigns Page (`/campaigns/events`)

**Purpose:** Showcase event-based fundraising capabilities

**Sections:**
- **Hero:** "Host Unforgettable Events That Raise Serious Funds"
- **What It Is:** Sell tickets, registrations, or passes to fundraising events
- **Event Types Supported:**
  - Golf scrambles and tournaments
  - Skills camps and clinics
  - Galas and dinners with speakers
  - Auctions (silent and live)
  - Field trips and experiences
  - Sports tournaments
- **Ticketing Features:**
  - Single tickets or group passes
  - Early bird pricing
  - VIP packages
  - Attendance tracking
  - Digital ticket delivery
- **Paired Sponsorship Integration:**
  - Businesses can sponsor event elements (hole sponsors, table sponsors)
  - Combine ticket sales with sponsorship packages
  - Maximize event revenue through dual approach
- **CTA:** Plan your next fundraising event

---

### 5. Merchandise Campaigns Page (`/campaigns/merchandise`)

**Purpose:** Explain merchandise and product sales capabilities

**Sections:**
- **Hero:** "Sell Team Gear and Fundraising Products with Ease"
- **What It Is:** Create an online store for team merchandise or fundraising items
- **Use Cases:**
  - Team apparel and spirit wear
  - Fundraising products (cookie dough, candles, etc.)
  - Custom merchandise
  - Seasonal items
- **Features:**
  - Product variants (sizes, colors)
  - Inventory tracking
  - Order management
  - Fulfillment coordination
  - Pre-order capabilities
- **Integration with Roster:** Track which team members sold what for attribution and incentives
- **CTA:** Start selling for your team

---

### 6. Roster-Enabled Campaigns Page (`/campaigns/roster`)

**Purpose:** Deep dive into peer-to-peer and roster attribution features

**Sections:**
- **Hero:** "Gamify Fundraising and Watch Your Team Compete"
- **Core Concept:** Individual tracking of participation in team fundraising efforts
- **Key Features:**
  - **Personal Fundraising Pages:** Each player/member gets their own page
  - **Leaderboards:** Real-time rankings create friendly competition
  - **Video Pitches:** Players can record personalized video messages for their page
  - **Personalized Links:** Unique URLs for each team member
  - **Custom QR Codes:** Quick sharing on social media or via text
  - **Progress Tracking:** Individual and team goal visualization
- **Player Dashboard Preview:**
  - Personal fundraising stats
  - Leaderboard position
  - Shareable links and QR code
  - Recent donations received
- **Benefits:**
  - Creates ownership and engagement
  - Extends reach through personal networks
  - Celebrates top performers
  - Teaches financial responsibility
- **CTA:** Enable roster attribution on your next campaign

---

### 7. Businesses Page (`/for-businesses`)

**Purpose:** Marketing page targeting businesses as supporters/sponsors

**Sections:**
- **Hero:** "Streamline Your Community Support Strategy"
- **Value Proposition:** One platform to manage all your local sponsorships and donations
- **Geographic Reach:**
  - Local: Support your immediate community
  - Regional: Expand to surrounding areas
  - National: Build brand presence across markets
- **Asset Management:**
  - Upload logos, images, and creative assets once
  - Reuse across multiple campaigns and organizations
  - Consistent brand representation
- **Centralized Support:**
  - Manage all school teams, clubs, and nonprofits from one dashboard
  - Track giving history and impact
  - View all active sponsorships
- **Simplified Billing:**
  - Single invoice option for multiple sponsorships
  - Clear records for tax purposes
  - Easy expense tracking and reporting
- **Business Portal Features:**
  - Upload required sponsorship assets
  - View campaign performance
  - Manage business profile
  - Access tax receipts
- **CTA:** Join as a Business Supporter

---

## Navigation Updates

**MarketingHeader.tsx** will need updates to include:
- New "Campaign Types" dropdown or submenu linking to campaign-specific pages
- "For Businesses" link in main navigation

---

## Routing Updates

**App.tsx** will add routes:
- `/campaigns-overview`
- `/campaigns/sponsorships`
- `/campaigns/donations`
- `/campaigns/events`
- `/campaigns/merchandise`
- `/campaigns/roster`
- `/for-businesses`

---

## Implementation Summary

| Page | Route | Primary Audience |
|------|-------|------------------|
| Campaigns Overview | `/campaigns-overview` | All prospects |
| Sponsorship Campaigns | `/campaigns/sponsorships` | Schools/Nonprofits |
| Donation Campaigns | `/campaigns/donations` | Schools/Nonprofits |
| Event Campaigns | `/campaigns/events` | Schools/Nonprofits |
| Merchandise Campaigns | `/campaigns/merchandise` | Schools/Nonprofits |
| Roster-Enabled Campaigns | `/campaigns/roster` | Schools/Teams |
| For Businesses | `/for-businesses` | Business prospects |

---

## Design Approach

All pages will follow the established marketing page patterns:
- Use `MarketingHeader` and `MarketingFooter` components
- Consistent section styling with gradient backgrounds
- Card-based feature grids
- Icon-driven visual hierarchy (lucide-react icons)
- Clear CTAs pointing to `/signup` or `/contact`
- Mobile-responsive layouts
- SEO meta tags for each page

---

## Technical Details

Each page will be created as a standalone React component in `src/pages/` following the pattern established by existing marketing pages. The pages will use:
- Tailwind CSS for styling
- shadcn/ui Card, Button, and Badge components
- lucide-react icons for visual elements
- react-router-dom Link components for navigation
- useLandingPageTracking hook for analytics

