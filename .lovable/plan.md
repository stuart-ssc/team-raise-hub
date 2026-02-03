

# Redesign Footer "Get Started" Section

## Problem

The current footer has 5 sections in a 4-column grid:
1. Logo/tagline
2. Product links
3. Campaigns links
4. Company links
5. Get Started (wraps to its own row)

This causes the "Get Started" section to appear on its own row, looking awkward and disconnected.

---

## Solution

Restructure the footer layout to place the "Get Started" section as a styled card on the right side of the main content row, with a colored background to make it stand out as a call-to-action.

---

## New Layout Structure

```text
+--------------------------------------------------+
|  Logo/Tagline  |  Product  |  Campaigns  |  Company  |  [ Get Started Card ]  |
+--------------------------------------------------+
|          Copyright  |  Terms  Privacy  DPA           |
+--------------------------------------------------+
```

---

## Implementation

**File:** `src/components/MarketingFooter.tsx`

### Changes:

1. **Update grid to 5 columns** on large screens: `lg:grid-cols-5`
2. **Style "Get Started" as a card** with:
   - Primary blue background (`bg-primary`)
   - White text (`text-primary-foreground`)
   - Rounded corners (`rounded-lg`)
   - Padding (`p-6`)
   - Ghost/outline button style for contrast

### Updated Grid Classes:
```typescript
// Current
className="grid grid-cols-1 md:grid-cols-4 gap-8"

// New
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8"
```

### Updated "Get Started" Section (lines 94-105):
```typescript
<div className="bg-primary text-primary-foreground rounded-lg p-6">
  <h3 className="font-semibold mb-3">Get Started</h3>
  <p className="text-sm text-primary-foreground/80 mb-4">
    Ready to transform your fundraising?
  </p>
  <Link 
    to="/signup" 
    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-white text-primary hover:bg-white/90 h-10 px-4 py-2"
  >
    Sign Up Free
  </Link>
</div>
```

---

## Visual Result

The footer will now display all sections in a single row on large screens, with the "Get Started" section appearing as an eye-catching blue card on the right side, drawing attention to the signup CTA while maintaining visual harmony with the rest of the footer.

