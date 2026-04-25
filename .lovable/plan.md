## Simplify OAuth buttons to single icon row

Compress the three OAuth options (Google, Microsoft, Facebook) on the Login page into one tidy row of equal-width icon-only buttons.

### Changes to `src/pages/Login.tsx`

**CSS (scoped `.sp-login` block)**
- Replace the existing `.sp-login-oauth-row` 2-column grid with a 3-column equal grid: `grid-template-columns: repeat(3, 1fr)` and slightly tighter gap (`8px`).
- Add `.sp-login-oauth-icon` style: square-ish pill (~48px tall), centered icon (~22px), white background, same border + hover treatment as today (border-color shift, subtle lift, soft shadow).
- Remove the dedicated Facebook row styles (`.sp-login-fb-row`, `.sp-login-fb-btn`) since Facebook joins the main row.
- Keep the existing reduced-motion and disabled states.

**Markup**
- Collapse the OAuth section into a single `.sp-login-oauth-row` containing three `<button>`s (Google, Microsoft, Facebook).
- Each button:
  - Uses the existing brand SVG (no text label).
  - Adds `aria-label` ("Continue with Google" / "Microsoft" / "Facebook") for accessibility.
  - Adds `title` attribute so hover reveals the provider name.
  - Keeps current `onClick` handlers and `disabled={loading}` behavior.
- Remove the separate "Or continue with Facebook" full-width button block.

**Behavior preserved**
- All three handlers (`handleGoogleLogin`, `handleMicrosoftLogin`, `handleFacebookLogin`) and the "Or with email" divider + email/password form remain unchanged.
- Mobile: 3 columns still fit comfortably since buttons are icon-only; the previous `@media (max-width: 520px)` single-column override is removed.

### Result
A clean, compact row of three equal icon buttons (Google, Microsoft, Facebook) above the "Or with email" divider, matching the minimal aesthetic of the redesigned Login page.