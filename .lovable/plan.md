
# Simplify 404 Font to Pacifico and Increase Size

## Overview

Remove Nexa Script font references and use Pacifico directly, while increasing the 404 text size by 25%.

---

## Changes

### File 1: `src/pages/NotFound.tsx`

Update the 404 heading style:

**Current:**
```typescript
style={{ 
  fontFamily: "'Nexa Script', 'Pacifico', cursive",
  fontSize: 'clamp(8rem, 20vw, 14rem)'
}}
```

**Updated (25% larger):**
```typescript
style={{ 
  fontFamily: "'Pacifico', cursive",
  fontSize: 'clamp(10rem, 25vw, 17.5rem)'
}}
```

---

### File 2: `src/index.css`

Remove the Nexa Script `@font-face` declaration (lines 6-13) since it's no longer needed. Keep the Pacifico Google Font import.

**Remove:**
```css
/* Nexa Script Bold font - with Pacifico fallback */
@font-face {
  font-family: 'Nexa Script';
  src: url('/fonts/NexaScript-Bold.woff2') format('woff2'),
       url('/fonts/NexaScript-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

---

## Summary

| Change | Before | After |
|--------|--------|-------|
| Font family | Nexa Script with Pacifico fallback | Pacifico only |
| Min size | 8rem | 10rem |
| Fluid size | 20vw | 25vw |
| Max size | 14rem | 17.5rem |
