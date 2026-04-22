

## Goal
Replace the inline QR display and the existing minimal `QRDialog` with a single shared, polished QR modal matching the mockup. Reuse it everywhere a QR button currently exists (Player Dashboard, My Fundraising, Family Dashboard).

## Mockup behavior
- Header: "Your personal QR code" + subtitle "Scan to support {Name} — {Campaign}"
- Two-column body:
  - Left card: framed QR with green "SCAN ME · {short code}" badge floating on the top edge, plus the short URL underneath
  - Right column:
    - Heading "Print it. Post it. Show it."
    - Supporting paragraph (mockup copy)
    - Primary blue button: "Download poster (PDF)"
    - Outline button: "Download QR image"
    - Outline button: "Copy short link"
    - Soft info pill at bottom (e.g. "3 scans today · last scanned 22 minutes ago") — only show when scan data is available; otherwise hide
- Maintain current text styling (Inter font, current weights, muted-foreground utilities). No new font families.

## Changes

### 1. Replace `src/components/player/QRDialog.tsx` with a new shared modal
Make it accept richer props so it can be reused everywhere:

```ts
interface QRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;                 // full share URL
  campaignName: string;
  participantName?: string;    // e.g. "Taylor"
  shortCode?: string;          // e.g. "TP #11" — shown in green badge
  shortUrl?: string;           // e.g. "sponsorly.com/give/tp11/banner" (defaults to url stripped of protocol)
  scanStats?: { today: number; lastScannedRelative?: string }; // optional info pill
}
```

Layout:
- `DialogContent` widened to `max-w-2xl`.
- Two-column grid (`md:grid-cols-2`) with the QR card on the left and CTA stack on the right.
- QR card: rounded border, white bg, padding; floating green pill badge (`bg-emerald-600 text-white`) positioned at the top center via `-top-3 absolute`.
- Buttons:
  - Download poster (PDF): primary (`Button`), full width, `Download` icon. Generates a print-ready letter-size PDF with the QR, campaign name, participant name, and short URL.
  - Download QR image: outline, full width, downloads PNG (rasterized from the SVG via `<canvas>`).
  - Copy short link: outline, full width, copies `url` to clipboard with toast.
- Info pill: `bg-muted/60` rounded row at the bottom of the right column; only rendered if `scanStats` is provided.

### 2. PDF poster generation
Use `jspdf` (lightweight, already common in this project pattern) to produce a single-page letter-size poster:
- Title: "Support {participantName} — {campaignName}"
- Large centered QR (rasterized from the modal's SVG)
- Short URL printed beneath the QR
- Footer: "sponsorly.io"
- Filename: `{campaign-slug}-{participant-slug}-poster.pdf`

If `jspdf` isn't already a dependency, add it.

### 3. PNG download (Download QR image)
Convert the existing SVG to a high-resolution PNG via an offscreen canvas and trigger download as `{campaign}-{participant}-qr.png`.

### 4. Wire the new modal into all roles

**`src/components/PlayerDashboard.tsx`**
Already uses `QRDialog`. Pass the new props:
- `participantName` from headline data
- `shortCode` if available (otherwise omit)
- `shortUrl` derived from `headline.personalUrl`

**`src/pages/MyFundraising.tsx`**
- Remove the inline `qrOpen` block (lines ~1192–1196) and `QRCode` from `react-qr-code` import.
- Replace `onToggleQR` state with a single `qrDialogStat: CampaignStat | null` state.
- Render one `<QRDialog />` at the bottom of the page driven by that state, passing `participantName` (`stat.childName` for parent view, current user first name otherwise), `campaignName`, `url = shareUrl`, and `shortUrl` derived from `shareUrl`.
- The existing QR `IconBtn` opens the dialog instead of toggling the inline panel.

**`src/pages/FamilyDashboard.tsx`**
- Remove inline QR rendering (`showQRCode === qrKey` block, lines ~759–763) and the `QRCode` import.
- Add a single `<QRDialog />` at page root driven by a `qrTarget` state object containing `{ shareUrl, childName, campaignName, shortUrl }`.
- The QR icon button sets `qrTarget` instead of toggling inline display.

### 5. Cleanup
- Remove `react-qr-code` usages from `MyFundraising.tsx` and `FamilyDashboard.tsx` (the new modal continues to use `qrcode.react`'s `QRCodeSVG`).
- Keep current text styling (Inter); use existing utility classes only — no new font imports, no gradients.

## Out of scope
- Tracking real "scans today / last scanned" data. The `scanStats` prop is supported in the component, but no role currently passes it, so the info pill won't render until scan tracking is added later.
- Changing any other layout on the host pages.
- Generating a real `shortCode` for participants — passed only when already known; otherwise the green badge falls back to "SCAN ME".

## Files touched
1. `src/components/player/QRDialog.tsx` — full rewrite to the shared modal
2. `src/components/PlayerDashboard.tsx` — pass new props
3. `src/pages/MyFundraising.tsx` — replace inline QR with shared modal, remove `react-qr-code`
4. `src/pages/FamilyDashboard.tsx` — replace inline QR with shared modal, remove `react-qr-code`
5. `package.json` — add `jspdf` if not present

## Verification
- Clicking any QR button on Player Dashboard, My Fundraising, and Family Dashboard opens the same modal styled like the mockup.
- "Copy short link" copies the full URL and toasts.
- "Download QR image" downloads a PNG of the QR.
- "Download poster (PDF)" downloads a printable poster PDF containing the QR, name, and short URL.
- No inline QR panels remain on any of the three pages.

