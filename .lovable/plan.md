

# Menu Reorganization: Campaigns Under Platform

## Change Summary

Move the "Campaigns" dropdown to become a sub-section under "Platform", creating a hierarchical navigation structure.

---

## Current Structure

```text
Schools | Nonprofits | Campaigns ▼ | Platform | Features | Pricing | For Businesses
```

## New Structure

```text
Schools | Nonprofits | Platform ▼ | Features | Pricing | For Businesses
                         └── Platform Overview
                         └── All Campaign Types
                         └── Sponsorship Campaigns
                         └── Donation Campaigns
                         └── Event Campaigns
                         └── Merchandise Campaigns
                         └── Roster-Enabled Campaigns
```

---

## Changes to MarketingHeader.tsx

### Desktop Navigation
1. Remove the standalone "Campaigns" dropdown
2. Convert "Platform" from a simple link to a dropdown menu
3. Add "Platform Overview" as first item (links to `/platform`)
4. Add all campaign types as submenu items below

### Mobile Navigation
1. Update the Platform section to show as expandable
2. Move Campaign Types section under Platform heading
3. Keep the same visual hierarchy with indentation

---

## Updated Data Structure

```typescript
const platformItems = [
  { name: 'Platform Overview', href: '/platform' },
  { name: 'All Campaign Types', href: '/campaigns-overview' },
  { name: 'Sponsorship Campaigns', href: '/campaigns/sponsorships' },
  { name: 'Donation Campaigns', href: '/campaigns/donations' },
  { name: 'Event Campaigns', href: '/campaigns/events' },
  { name: 'Merchandise Campaigns', href: '/campaigns/merchandise' },
  { name: 'Roster-Enabled Campaigns', href: '/campaigns/roster' },
];

const navigation = [
  { name: 'Schools', href: '/schools' },
  { name: 'Nonprofits', href: '/nonprofits' },
  // Platform removed - now a dropdown
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
];
```

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/MarketingHeader.tsx` | Restructure navigation to put Campaigns under Platform dropdown |

