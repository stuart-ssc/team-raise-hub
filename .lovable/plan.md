## Goal

Fix the right-side social-proof panel on `/signup` so vertical spacing, the leaderboard placement, and the floating notification cards match the provided mockup. No left-column / form changes.

## Current problems (vs. mockup)

1. The leaderboard uses `margin-top: auto`, which jams it against the bottom and leaves a huge empty gap below the Mrs. Patel quote.
2. The "NEW DONATION" notification (`top: -18px; right: -16px`) currently overlaps the leaderboard title row instead of sitting cleanly above the card's top-right corner.
3. The "PAYOUT" notification (`bottom: 100px; left: -22px`) floats in the middle of the leaderboard rows; in the mockup it sits at the bottom-left corner of the leaderboard, slightly outside it.
4. Stats footer ($12.4M / 500+ / $0) gets pushed below the fold because the leaderboard is forced to the bottom.
5. Panel padding is too generous at the top, pushing the quote down further than the mockup.

## Fix

Edit only the `.sp-signup-right*` CSS rules and the notification card markup classes in `src/pages/Signup.tsx`.

### CSS changes (inside `SCOPED_CSS`)

- `.sp-signup-right`: reduce vertical padding from `48px 56px` → `40px 56px 36px`; keep `display: flex; flex-direction: column`.
- `.sp-signup-quote-block`: change `margin-top: 56px` → `margin-top: 72px` and tighten `.sp-signup-quote` line spacing if needed (keep current font sizes).
- `.sp-signup-leaderboard-wrap`: remove `margin-top: auto`; replace with `margin-top: 56px` so it follows the quote with a balanced gap (matches mockup proportions).
- `.sp-signup-stats`: change `margin-top: 36px` → `margin-top: auto; padding-top: 28px;` so the stats row is the element pinned to the bottom of the column (mockup shows stats hugging the panel bottom, not the leaderboard).
- `.sp-signup-notif.top-right`: reposition to `top: -28px; right: -20px;` and add a higher `z-index: 2` so it sits clearly above the card's top edge without overlapping the "Top fundraisers · live" title.
- `.sp-signup-notif.bottom-left`: change `bottom: 100px; left: -22px;` → `bottom: -22px; left: -22px;` so it anchors at the leaderboard's bottom-left corner (as in mockup). Add `z-index: 2`.
- Add `.sp-signup-leaderboard { position: relative; }` (notifications already absolute) — and move the two `.sp-signup-notif` elements inside the `.sp-signup-leaderboard` div in JSX so their absolute positioning is relative to the card itself, not the wrapper. This guarantees consistent corner placement.
- Tighten leaderboard internal spacing slightly: `.sp-signup-row` padding `10px 0` → `12px 0` and increase `.sp-signup-leaderboard` padding from `22px` → `20px 22px` (closer match to mockup density).
- `.sp-signup-quote-mark`: increase `margin-bottom` by setting `.sp-signup-quote { margin-top: 22px; }` (was 28px) for a tighter mockup-style stack.

### JSX changes (right column only, ~lines 723–795)

- Move both `.sp-signup-notif.top-right` and `.sp-signup-notif.bottom-left` divs **inside** the `.sp-signup-leaderboard` div (currently siblings of it inside `.sp-signup-leaderboard-wrap`). This anchors them to the card's corners reliably.

### Resulting vertical rhythm (desktop, top → bottom)

```text
[ live chip ............................ sponsorly.io ]    ← top, 40px padding
                  (72px gap)
,, (green quote marks)
Our PTO brought in 3× more donors ...
———————————
[avatar] Mrs. Patel
         Riverside PTO · President
                  (56px gap)
┌───────────────────────────────────────[NEW DONATION]┐
│ Top fundraisers · live                              │
│ 1  WL  Westlake Wildcats · Soccer            $48k   │
│ 2  EV  Evergreen MS Band                     $38k   │
│ 3  PC  Pinecrest Robotics                    $32k   │
│ 4  RP  Riverside PTO                         $28k   │
└[PAYOUT]─────────────────────────────────────────────┘
                  (margin-top: auto → push stats to bottom)
$12.4M           500+              $0
Raised this year Schools & programs Platform fees       ← 36px from bottom
```

### Out of scope
- No changes to the form/left column.
- No changes to OAuth buttons, validation, or auth logic.
- No new images or assets.

### Files touched
- `src/pages/Signup.tsx` (CSS string + right-aside JSX only)
