## Goal

Redesign `src/pages/Login.tsx` to mirror the Sponsorly Auth 2 mockup and match the new Signup page styling (paper left form, dark right social-proof panel). Keep all existing auth logic intact (email/password, Google, Microsoft, Facebook, forgot password, redirect handling, "Remember me").

## Visual spec (from mockup)

**Top bar (full width, paper background)**
- Sponsorly logo on the left
- Right side: "New to Sponsorly?" muted text + dark pill button "Create account" → `/signup`

**Left column (paper `#FAFAF7`, ~50% width on desktop, 100% on mobile)**
- Eyebrow: blue 22px rule + "WELCOME BACK" (uppercase, tracked)
- Headline (Instrument Serif): "Sign in to *Sponsorly*" with the word "Sponsorly" in blue italic + peach underline accent (same treatment used on Signup)
- Sub copy: "Pick up where you left off. Check campaign progress, review donations, and send the next follow-up."
- Inline link: "Don't have an account? **Start one free →**"
- Two pill OAuth buttons (50/50 grid): "Continue with Google" + "Continue with Microsoft"
- Tiny secondary row for Facebook (icon-only round button, centered under the OAuth row) — keeps Facebook reachable without breaking the mockup's two-up layout
- "OR WITH EMAIL" divider
- Email input → Password input with "Show/Hide" toggle (matches Signup style)
- Row: "Keep me signed in" checkbox (left) + "Forgot password?" link (right)
- Primary blue pill "Sign in →"
- Bottom fineprint links unchanged

**Forgot-password mode**
- Same shell, swap headline to "Reset *password*" with peach underline
- Show single email input + "Send reset link →" primary button + "Back to sign in" link

**Right column (deep navy `#0A0F1E`, hidden below `lg`)**
- Top: green live chip "● 847 fundraisers raising right now" + muted "sponsorly.io"
- Large green serif quote-marks
- Headline (Instrument Serif): "Payouts hit our account the *same day*. Our band is already on the bus." (italic green accent on "same day")
- Thin divider + attribution: avatar "JY" / "Dir. Young / Evergreen MS Band Director"
- **Mock campaign card** (white card on navy):
  - Faux browser chrome with `sponsorly.com/c/hawks-basketball-2026`
  - Orange "HAWKS × PTO" pill chip
  - Image area: subtle navy gradient block (no real image needed) labeled stylistically
  - Card body: "Hawks Basketball — New Uniforms & Travel" headline (Instrument Serif)
  - Sub: "Help us send all 18 players to State. Every dollar goes to the team."
  - 3-stat row: $18,420 raised · 204 donors · 11 days left
  - Green progress bar at 74% with "74% of $25,000 goal" label
  - Donation amount row: $25 / $50 / $100 outline pills + blue "Donate" pill
  - Floating "NEW DONATION · $250 from the Chen family" notif card pinned to top-right (with floating animation, reuse Signup keyframes)
  - Floating "PAYOUT · $4,120 → Lincoln HS" notif card pinned to bottom-left (with floating animation)
- Bottom stats row (3 cols, pinned to panel bottom via `margin-top: auto`): $12.4M Raised this year · 500+ Schools & programs · $0 Platform fees

## Implementation

Edit only `src/pages/Login.tsx`. Drop the shadcn `Button/Input/Label/Checkbox/Card/Avatar` primitives in favor of native elements styled by a `.sp-login` scoped CSS block (same approach as Signup). This keeps both auth pages visually consistent without adding new shared components.

### Scoped CSS (`.sp-login`)
- Reuse the same brand tokens from Signup: `--sp-blue #1F5FE0`, `--sp-blue-deep #0B3FB0`, `--sp-green #0E9F6E`, `--sp-accent #FF6B35`, `--sp-ink #0A0F1E`, `--sp-paper #FAFAF7`, Instrument Serif display, Geist UI
- Reuse classes/patterns: eyebrow rule, accented headline word with peach underline, OAuth pill buttons, password Show/Hide toggle, primary blue pill button, navy right panel, live chip, floating notif cards with `sp-float-a` / `sp-float-b` keyframes, prefers-reduced-motion guard
- Add new classes specific to the campaign-card mockup: `.sp-login-campaign`, `.sp-login-campaign-chrome`, `.sp-login-campaign-hero`, `.sp-login-campaign-stats`, `.sp-login-campaign-progress`, `.sp-login-campaign-amounts`

### JSX structure
```text
<div class="sp-login">
  <style>{SCOPED_CSS}</style>
  <header sp-login-topbar>
    [logo]                           [New to Sponsorly?] [Create account →]
  </header>
  <div sp-login-shell>
    <section sp-login-left>
      <div sp-login-form>
        eyebrow → headline → sub → "Don't have an account? Start one free"
        OAuth row (Google / Microsoft)
        Facebook icon button (centered, small)
        "Or with email" divider
        email input
        password input (with Show/Hide)
        Keep-me-signed-in + Forgot password row
        Sign in button
      </div>
    </section>
    <aside sp-login-right>
      live chip / domain
      green quote-marks + serif quote + attribution
      campaign card with two floating notif cards
      stats footer pinned to bottom
    </aside>
  </div>
</div>
```

### Logic preserved (no functional changes)
- `useAuth()` hook: `signIn`, `signInWithGoogle`, `signInWithMicrosoft`, `signInWithFacebook`, `resetPassword`, `user`
- `redirectTo` from `location.state.from` after successful login
- Toasts on success/error for every auth path
- `showForgotPassword` state toggles between sign-in and reset-password views in the same left column
- `rememberMe` state preserved (continues to drive whatever existing handler does)

### Out of scope
- No changes to `useAuth`, Supabase config, or routes
- No new shared components (CSS scoped per-page, matching Signup approach)
- No changes to Signup, Pricing, or other pages

## Files touched
- `src/pages/Login.tsx` (full rewrite of presentation; logic preserved verbatim)
