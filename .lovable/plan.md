

# Fix "Why Businesses Choose Sponsorly" Section

## Problem

The current stats section incorrectly claims "100% Tax-deductible" which is not accurate. This needs to be replaced with messaging that highlights the centralization of community support - a core value proposition of the platform.

---

## Current Content (Line 407)

```typescript
{ stat: '100%', label: 'Tax-deductible', desc: 'with instant receipts' },
```

## Updated Content

```typescript
{ stat: '1', label: 'Central hub', desc: 'for all community giving' },
```

This change:
- Removes the inaccurate tax claim
- Highlights the centralization benefit (one place to manage all sponsorships)
- Aligns with the page's core messaging about streamlining community support

---

## File to Modify

| File | Line | Change |
|------|------|--------|
| `src/pages/ForBusinesses.tsx` | 407 | Replace tax-deductible stat with centralization messaging |

