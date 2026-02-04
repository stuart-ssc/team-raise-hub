

# Enhanced 404 Page with MarketingHeader and Custom Typography

## Overview

Update the 404 page to include the site navigation header, remove the standalone logo, and create a more impactful "404" display with custom font styling and alternating brand colors.

---

## Design Changes

1. **Add MarketingHeader** - Full site navigation at the top
2. **Remove SponsorlyLogo** - No longer needed since header has the logo
3. **Larger 404** - Increase from `text-8xl` to a massive custom size
4. **Nexa Script Bold font** - Apply custom font to the 404 numbers
5. **Alternating colors** - Blue and green from the Sponsorly brand

---

## Layout Structure

```text
+--------------------------------------------------+
|  [MarketingHeader with full navigation]          |
+--------------------------------------------------+
|                                                  |
|                    4 0 4                         |
|            (blue-green-blue alternating)         |
|                                                  |
|       "Oops! This page took a detour"            |
|    "The page you're looking for doesn't..."      |
|                                                  |
|     [ Go Home ]  [ Explore Features ]            |
|              [ Contact Us ]                      |
|                                                  |
+--------------------------------------------------+
```

---

## Technical Implementation

### File Changes

**File 1:** `src/index.css`

Add the Nexa Script Bold font face:

```css
@font-face {
  font-family: 'Nexa Script';
  src: url('/fonts/NexaScript-Bold.woff2') format('woff2'),
       url('/fonts/NexaScript-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

Note: The font file will need to be added to `public/fonts/`. If the font isn't available yet, we can use a fallback approach with a Google Font like "Pacifico" or "Lobster" that has a similar script style.

---

**File 2:** `src/pages/NotFound.tsx`

Update the component:

1. **Import MarketingHeader** instead of SponsorlyLogo
2. **Remove the logo** from the content area
3. **Split "404" into individual styled spans** with alternating colors:
   - "4" - Blue (`#1c6dbe` / primary)
   - "0" - Green (`#2AA87E`)  
   - "4" - Blue (`#1c6dbe` / primary)
4. **Apply Nexa Script Bold font** via inline style or CSS class
5. **Increase size** to approximately `text-[12rem]` or larger

### Updated 404 Display:

```typescript
<div className="space-y-4">
  <h1 
    className="font-bold leading-none"
    style={{ 
      fontFamily: "'Nexa Script', cursive",
      fontSize: 'clamp(8rem, 20vw, 14rem)'
    }}
  >
    <span style={{ color: '#1c6dbe' }}>4</span>
    <span style={{ color: '#2AA87E' }}>0</span>
    <span style={{ color: '#1c6dbe' }}>4</span>
  </h1>
  {/* ... rest of content */}
</div>
```

### Updated Page Structure:

```typescript
<div className="min-h-screen flex flex-col">
  <MarketingHeader />
  
  <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
    <div className="text-center max-w-md space-y-8">
      {/* Large 404 with alternating colors */}
      {/* Friendly message */}
      {/* Navigation buttons */}
    </div>
  </main>
</div>
```

---

## Color Reference

| Character | Color Name | Hex Value |
|-----------|------------|-----------|
| 4 | Sponsorly Blue | #1c6dbe |
| 0 | Sponsorly Green | #2AA87E |
| 4 | Sponsorly Blue | #1c6dbe |

---

## Font Fallback Strategy

If Nexa Script Bold font files aren't available:

**Option A:** Use a similar Google Font as fallback
```css
font-family: 'Nexa Script', 'Pacifico', cursive;
```

**Option B:** Proceed with the implementation structure and the font can be uploaded to `public/fonts/` later

---

## Files to Modify

1. `src/pages/NotFound.tsx` - Main component changes
2. `src/index.css` - Add font-face declaration (if font files available)

