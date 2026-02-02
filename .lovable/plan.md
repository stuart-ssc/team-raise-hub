

## Redesign Social Login Buttons

### Summary
Transform the social login buttons (Google, Facebook, Microsoft) from full-width text buttons to square icon-only buttons displayed side by side in a row.

---

### Visual Change

**Before:**
```text
+----------------------------------+
|  [G] Continue with Google        |
+----------------------------------+
|  [F] Continue with Facebook      |
+----------------------------------+
|  [M] Continue with Microsoft     |
+----------------------------------+
```

**After:**
```text
+--------+   +--------+   +--------+
|        |   |        |   |        |
|   G    |   |   F    |   |   M    |
|        |   |        |   |        |
+--------+   +--------+   +--------+
```

---

### Files to Modify

**1. src/pages/Login.tsx**
- Change button container from `grid grid-cols-1` to `flex justify-center gap-4`
- Make each button square (14x14 or similar)
- Remove text labels ("Continue with...")
- Increase icon size from `h-4 w-4` to `h-6 w-6`
- Remove `mr-2` margin from icons since no text follows

**2. src/pages/Signup.tsx**
- Apply the same changes to match the Login page

---

### Technical Details

Button styling changes:
```tsx
// Container: side by side with gap
<div className="flex justify-center gap-4">

// Each button: square with large centered icon
<Button
  type="button"
  variant="outline"
  className="h-14 w-14 p-0"
  onClick={handleGoogleLogin}
  disabled={loading}
>
  <svg className="h-6 w-6" viewBox="0 0 24 24">
    {/* Google icon paths */}
  </svg>
</Button>
```

The buttons will be:
- 56px x 56px (h-14 w-14)
- No padding (p-0) to maximize icon space
- Icon size increased to 24x24 (h-6 w-6)
- Centered with flexbox
- Spaced with 16px gap (gap-4)

