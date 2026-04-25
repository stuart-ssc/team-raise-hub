## Redesign Signup Page to Match Mockup

Rebuild `src/pages/Signup.tsx` to match the uploaded mockup, using the same `sp-*` design system already used on Pricing, Platform, Features, CampaignsOverview, Schools, and Index. All existing auth logic (email/password, invite tokens, Google/Facebook/Microsoft OAuth) is preserved.

### Layout

Two-column, full-viewport. Right column hidden below `lg`.

**Left column (paper background `#FAFAF7`, ~50% width)**

Header bar (top, full width of left column):
- Sponsorly full-color logo (left)
- "Already a member?  [Sign in]" — small text + dark pill button linking to `/login` (right)

Form area (centered, max-width ~520px, generous padding):
- Eyebrow: small line + "GET STARTED" (uppercase, tracked, blue)
- Display headline (Instrument Serif): "Start raising in" then on the next line *minutes.* in italic blue with a soft peach/coral underline highlight
- Sub-copy (muted ink): "Create your free account — no card required, no platform fees, no monthly minimum. Your first fundraiser can be live in under 5 minutes."
- "Already have an account? Sign in →" inline link
- **OAuth row** (two pill buttons side by side): "Continue with Google" and "Continue with Microsoft" — white background, 1px border, rounded-xl, brand SVG + label
- Divider: "OR WITH EMAIL" centered
- "I'm fundraising for…" label with three selectable cards (radio-style):
  - A school team — Coach or AD (graduation-cap icon, blue tile)
  - A club or org — Band, robotics, etc. (people icon)
  - A PTO / PTA — School-wide drive (briefcase icon)
  - Selected card: white bg, blue 2px border, soft shadow; unselected: paper-2 bg, line border. Stored in local state (UI only — does not affect signup payload yet).
- First name / Last name (two-column inputs with placeholders "Jamie" / "Rivera")
- Organization or team — single input ("e.g. Lincoln HS Track & Field") with a tiny green check + helper "We'll set up your fundraiser page under this name." (UI only — local state)
- Email input (placeholder "coach@lincolnhs.edu")
- Password input with "Show" toggle on the right and a 4-segment strength meter underneath (placeholder "At least 8 characters"). Strength bar fills based on length (≥8, ≥10, ≥12 + mixed chars).
- Checkbox: "Send me fundraising tips (optional)" (UI only)
- Primary CTA: "Create free account →" — full-width pill, `--sp-blue` background, soft glow shadow
- Footer microcopy: "By creating an account you agree to our **Terms of Service** and **Privacy Policy**. Sponsorly never shares donor data." (links to `/terms` and `/privacy`)
- **Facebook OAuth retained**: per requirement, also include a third "Continue with Facebook" pill button alongside Google and Microsoft (the mockup shows only Google + Microsoft, but the user explicitly requested all three providers be retained, so all three render in the OAuth row — Google, Microsoft, Facebook — same pill style).

**Right column (deep navy `#0A0F1E` panel, hidden below `lg`)**

- Top-right small label: "sponsorly.io" (white/60)
- Top-left chip: green dot + "847 fundraisers raising right now" (rounded-full, dark green tint)
- Large quotation mark glyph (Instrument Serif italic, green tint)
- Display testimonial (Instrument Serif, white): "Our PTO brought in *3× more donors* than last year, with half the effort." — with "3× more donors" in italic green
- Thin divider line, then attribution: avatar circle (purple "AP"), "Mrs. Patel", "Riverside PTO · President"
- "Top fundraisers · live" card (dark glass — white at 4% opacity, 1px white-12 border, rounded-2xl):
  - 4 ranked rows: Westlake Wildcats · Soccer ($48k), Evergreen MS Band ($38k), Pinecrest Robotics ($32k), Riverside PTO ($28k) — each with rank number, colored avatar tile (orange/blue/green/purple), name + "X donors · Y days", and amount on the right
- Two floating notification cards overlapping the leaderboard:
  - Top right: green check + "NEW DONATION — $250 from the Chen family — Go Lincoln! 🏆 · 2s ago"
  - Bottom left: blue check + "PAYOUT — $4,120 → Lincoln HS — Arrived 11:42 AM today"
- Footer stats row (3 columns, separated by thin divider): "$12.4M Raised this year", "500+ Schools & programs", "$0 Platform fees"

### Technical Details

- File touched: `src/pages/Signup.tsx` only.
- Add a scoped style block (`SCOPED_CSS` string in a `<style>` tag) inside the component, using the same token set as Pricing/Index: `--sp-blue`, `--sp-blue-deep`, `--sp-green`, `--sp-accent` (peach underline), `--sp-ink`, `--sp-ink-2`, `--sp-muted`, `--sp-line`, `--sp-paper`, `--sp-paper-2`, `--sp-display` (Instrument Serif), `--sp-ui` (Geist/Inter).
- Wrap entire return in `<div className="sp-signup">` so styles do not leak. All custom classes prefixed `sp-signup-*`.
- Component classes to define: `.sp-signup-input`, `.sp-signup-label`, `.sp-signup-eyebrow`, `.sp-signup-headline`, `.sp-signup-btn-primary`, `.sp-signup-oauth-btn`, `.sp-signup-divider`, `.sp-signup-fundraiser-card` (+ `--selected`), `.sp-signup-strength` (+ filled segments), `.sp-signup-panel`, `.sp-signup-quote`, `.sp-signup-leaderboard`, `.sp-signup-notif-card`, `.sp-signup-stat`.
- Keep ALL existing hooks/state/effects: `useAuth`, `useToast`, `useNavigate`, `useSearchParams`, invitation token fetch effect, post-signup invitation acceptance effect, `handleSignup` (with password match validation), `handleGoogleSignup`, `handleFacebookSignup`, `handleMicrosoftSignup`.
- New local UI state (does not change submission payload):
  - `fundraiserType: 'school' | 'club' | 'pto'` (default `'school'`)
  - `organizationName: string`
  - `showPassword: boolean`
  - `tipsOptIn: boolean`
- Preserve invitation alert above the form when `invitationInfo` exists, restyled to match (rounded-xl, blue-tinted background, no shadcn Alert chrome).
- Replace shadcn `Card`, `Alert`, `Button` chrome with native styled elements. Keep using shadcn `Input`, `Label`, `Checkbox` underneath custom classes if convenient, otherwise native elements.
- OAuth SVGs: reuse the exact existing inline SVGs for Google, Microsoft, Facebook.
- Mobile (<lg): hide right panel; left column fills viewport. Header bar (logo + Sign in link) stays visible at top.
- Fonts: Instrument Serif loaded the same way as on Pricing/Index (project already pulls these in). No new dependencies.

### Out of Scope
- No backend changes — `fundraiserType` and `organizationName` are captured in UI only and do not yet flow into signup. They can be wired into the post-signup organization-setup flow in a follow-up.
- No changes to `useAuth`, routing, OAuth providers, or invitation logic.
- Login page is not touched.
