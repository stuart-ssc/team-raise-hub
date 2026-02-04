
# Creative Branded 404 Page

## Overview

Replace the current plain 404 page with a branded, friendly page that fits Sponsorly's visual style and helps users find their way.

---

## Design Concept

A clean, centered layout with:
- Sponsorly logo at top
- Large, friendly "404" display with a subtle gradient/primary color accent
- Warm, encouraging message (not technical jargon)
- Quick navigation suggestions as simple buttons
- Consistent styling with marketing pages

---

## Layout Structure

```text
+------------------------------------------+
|             [Sponsorly Logo]             |
+------------------------------------------+
|                                          |
|                  404                     |
|         (large, styled number)           |
|                                          |
|     "This page went on a fundraiser"     |
|       "and hasn't come back yet."        |
|                                          |
|     [ Go Home ]  [ View Features ]       |
|                 [ Contact Us ]           |
|                                          |
+------------------------------------------+
```

---

## Implementation

**File:** `src/pages/NotFound.tsx`

### Changes:

1. **Add imports:**
   - `Link` from react-router-dom
   - `Button` from ui/button
   - `SponsorlyLogo` component
   - `Home`, `Compass`, `HelpCircle` icons from lucide-react

2. **Update layout:**
   - Full-screen centered layout with gradient background matching marketing pages
   - Sponsorly logo at top for brand recognition
   - Large "404" with primary color styling
   - Friendly, on-brand message
   - Three navigation buttons: Home, Features, Contact

3. **Keep error logging:**
   - Retain the console error for debugging purposes

### Updated Component Structure:

```typescript
// Imports
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { Home, Compass, HelpCircle } from "lucide-react";

// Component with:
// - Gradient background (from-primary/5 via-background to-secondary/5)
// - Centered content with max-w-md
// - Logo at top
// - Large "404" in text-8xl with text-primary
// - Friendly headline and subtext
// - Three Button links with icons
```

### Suggested Navigation Links:

| Button | Icon | Route | Label |
|--------|------|-------|-------|
| Primary | Home | `/` | Go Home |
| Outline | Compass | `/features` | Explore Features |
| Ghost | HelpCircle | `/contact` | Contact Us |

---

## Visual Styling

- **Background:** Gradient matching homepage hero (`bg-gradient-to-br from-primary/5 via-background to-secondary/5`)
- **404 Number:** `text-8xl font-bold text-primary`
- **Headline:** `text-2xl font-semibold text-foreground`
- **Subtext:** `text-muted-foreground`
- **Buttons:** Stacked on mobile, row on desktop with consistent sizing

---

## Copy

**Headline:** "Oops! This page took a detour"

**Subtext:** "The page you're looking for doesn't exist or has been moved. Let's get you back on track."

This keeps the tone friendly and helpful without being overly cute or unprofessional.
