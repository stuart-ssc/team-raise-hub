

## Fix Icon Size to 2.5rem

### Summary
Update the social login icon SVGs to use explicit 2.5rem sizing via inline styles instead of Tailwind classes, ensuring the icons render at the correct size.

---

### Changes Required

**1. src/pages/Login.tsx**

Update all three social login icon SVGs to use inline styles:

- Line 260 (Google): Change `className="h-12 w-12"` to `style={{ height: '2.5rem', width: '2.5rem' }}`
- Line 307 (Facebook): Change `className="h-12 w-12"` to `style={{ height: '2.5rem', width: '2.5rem' }}`
- Line 319 (Microsoft): Change `className="h-12 w-12"` to `style={{ height: '2.5rem', width: '2.5rem' }}`

**2. src/pages/Signup.tsx**

Apply the same changes to all three social login icons on the signup page.

---

### Technical Details

Using inline styles ensures the exact 2.5rem (40px) size is applied:

```tsx
<svg style={{ height: '2.5rem', width: '2.5rem' }} viewBox="0 0 24 24">
  {/* icon paths */}
</svg>
```

This approach bypasses any potential Tailwind class specificity issues and guarantees the icons render at exactly 2.5rem.

