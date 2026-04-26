## Goal

Bring the `/contact` page in line with the new 2026 marketing design language used on the audience pages (Sports Teams, PTOs & PTAs, Booster Clubs, Marching Bands, Nonprofits, etc.). The current page uses generic Tailwind/HSL primary blocks and a basic two-column form — it visually clashes with the rest of the marketing site.

## What the page will look like

1. **Hero** (cream/paper background, serif display headline)
   - Animated green chip: "● We typically reply in 24 hours"
   - Headline: `Talk to the team behind` *`Sponsorly.`* (display serif with italic theme accent)
   - Subhead: friendly one-liner about helping schools, boosters, PTOs, and nonprofits get up and running.
   - Three "micro" check points under the subhead (Free to start · No card required · Live human reply).
   - No hero image card — keep it focused since the form sits below.

2. **Two-column main section** (white `alt` section)
   - **Left column — "How can we help?"**
     - Eyebrow: `GET IN TOUCH`
     - Display serif H2 with italic theme word.
     - Three info cards (rounded, bordered, hover-lift) each with an icon tile:
       - **Email us** — `support@sponsorly.io` (mailto link)
       - **Already a customer?** — Link to `/login`
       - **Looking for answers fast?** — Link to `/faq`
     - Bottom "What to expect" panel restyled as a `sp-check-list` with theme-tinted tick circles (Quick response, Personalized guidance, Setup & strategy help, Technical support).
   - **Right column — Contact form card**
     - White card with `sp-line` border, 18px radius, soft shadow (matches `.sp-crm-mock` / `.sp-pillar` styling).
     - Inputs restyled to match the design system: 12px radius, light border, theme-colored focus ring, serif-free labels.
     - Submit button uses `.sp-btn .sp-btn-primary .sp-btn-lg` (pill, theme background).
     - Keep all existing form logic, validation (zod), Supabase insert, and edge function call exactly as-is.

3. **FAQ teaser strip** (cream section)
   - Eyebrow: `COMMON QUESTIONS`
   - Headline: `Maybe we've already` *`answered it.`*
   - 3-card grid linking into `/faq` (Account, Campaigns, Payments) — reuses the `.sp-pillar` card pattern.

4. **Final CTA** (dark stats-strip style, matches the audience pages)
   - Green chip "Free forever. No card required."
   - Display serif headline: `Ready to start raising more?` / *`We'll help you launch in a day.`*
   - Two pill buttons: "Start free" (`/signup`) and "Browse the platform →" (`/platform`).

5. **Footer** — keep `MarketingFooter` (already used by audience pages).

## Design tokens reused

All styling reuses the existing `AUDIENCE_SCOPED_CSS` tokens (`--sp-theme: blue`, paper background, Instrument Serif display font, pill buttons, eyebrows, `.sp-chip`, `.sp-sec-head`, `.sp-pillars`, `.sp-check-list`, `.sp-final-cta`, `.sp-stats-strip`, etc.) so the page matches the audience pages exactly. Theme is `blue` (Sponsorly primary).

## Technical notes

**File to edit:** `src/pages/Contact.tsx` (single file)

- Wrap the page in `<div className="sp-aud theme-blue">` and inject `AUDIENCE_SCOPED_CSS` via `<style dangerouslySetInnerHTML>` — same pattern used by `AudiencePage.tsx`.
- Add a small page-scoped `<style>` block for contact-specific bits not in the shared CSS:
  - `.sp-contact-grid` (two-column 1fr / 1.1fr layout, collapses to single column under 900px).
  - `.sp-info-card` (rounded card with icon tile + text + arrow, mirrors `.sp-pillar`).
  - `.sp-form-card` (form container) and `.sp-field` / `.sp-input` overrides so the existing shadcn `Input`/`Textarea` adopt the rounded, bordered, theme-focus look. Keep using shadcn components — only override styles via className.
- Preserve current form logic completely:
  - `react-hook-form` + `zodResolver(contactSchema)`.
  - `supabase.from("contact_submissions").insert(...)` then `supabase.functions.invoke("send-contact-notification", ...)`.
  - Toast on success/error, `reset()` on success, `isSubmitting` state.
- Replace `MarketingHeader`/`MarketingFooter` placement to match audience pages (header above the `.sp-aud` content, footer at the very bottom inside the wrapper — same as `AudiencePage.tsx`).
- Keep the existing `<SeoHead>` with the same title/description/path so SEO is unchanged.
- Icons: use `lucide-react` (`Mail`, `LogIn`, `HelpCircle`, `Send`, `Check`) inside themed icon tiles styled with `background: var(--sp-theme-soft); color: var(--sp-theme); border-radius: 12px`.
- Responsive: form column stacks below info column on `<900px`; final CTA and FAQ teaser collapse to single column on mobile via existing audience CSS breakpoints + a small media query for `.sp-contact-grid`.

## Out of scope

- No changes to the contact submission backend, edge function, or database schema.
- No changes to other pages, the marketing header, or the footer.
- No new images or assets needed.
