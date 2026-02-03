

# Simplified Platform Menu with Clickable Title

## Change Summary

Simplify the Platform dropdown to only show 2 items, and make "Platform" itself clickable to navigate to the Platform page.

---

## Current vs New Structure

**Current:**
```text
Platform ▼
  └── Platform Overview
  └── All Campaign Types
  └── Sponsorship Campaigns
  └── Donation Campaigns
  └── Event Campaigns
  └── Merchandise Campaigns
  └── Roster-Enabled Campaigns
```

**New:**
```text
Platform (clickable → /platform) ▼
  └── Campaigns
  └── Roster Enabled Campaigns
```

---

## Changes to MarketingHeader.tsx

### 1. Simplify platformItems array
Reduce from 7 items to just 2:
```typescript
const platformItems = [
  { name: 'Campaigns', href: '/campaigns-overview' },
  { name: 'Roster Enabled Campaigns', href: '/campaigns/roster' },
];
```

### 2. Make Platform clickable in Desktop Navigation
Replace the current dropdown trigger with a split design where "Platform" is a clickable link and the chevron opens the dropdown:
```typescript
<div className="flex items-center">
  <Link
    to="/platform"
    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
  >
    Platform
  </Link>
  <DropdownMenu>
    <DropdownMenuTrigger className="flex items-center text-muted-foreground hover:text-foreground transition-colors ml-1">
      <ChevronDown className="h-4 w-4" />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {platformItems.map(...)}
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

### 3. Update Mobile Navigation
- Make "Platform" a clickable link to `/platform`
- Show only the 2 submenu items (Campaigns, Roster Enabled Campaigns)

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/MarketingHeader.tsx` | Simplify dropdown items and make Platform title clickable |

