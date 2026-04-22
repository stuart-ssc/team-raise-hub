

## Goal
Rebuild the player's "Record Pitch" experience as a focused 3-step wizard modal — Message → Headshot → Record — matching the mockup, while keeping the platform's existing fonts/colors/buttons.

## Scope
- Applies to the player-facing pitch flow only (PlayerDashboard "Record pitch" button + the inline pitch editor in My Supports / MyFundraising).
- The org-side `CampaignPitchEditor` and `CampaignPitchSection` are **out of scope** — they edit the campaign-level pitch and stay as-is.

## New component
Create `src/components/player/PitchWizard.tsx` implementing the 3-step flow:

### Layout (matches screenshots)
```text
┌─────────────────────────────────────────────────────┐
│ Build your pitch — {Campaign Name}              [×] │
│ Message · headshot · video. All three together      │
│ raise 3.2× more.                                    │
├─────────────────────────────────────────────────────┤
│  (1 Message) ─── (2 Headshot) ─── (3 Record)        │  ← stepper pills
├─────────────────────────────────────────────────────┤
│  STEP X · {STEP LABEL}                              │
│  {Step heading}                                     │
│  {Step subhead}                                     │
│                                                     │
│  {step body}                                        │
├─────────────────────────────────────────────────────┤
│  N of 3 complete       [Back]   [Continue / Finish] │
└─────────────────────────────────────────────────────┘
```

### Step 1 — Message
- Heading: **"Say it in your own voice"**
- Sub: "This is the note that shows on your donation page, above your pitch video."
- `Textarea` (rows 5, maxLength **280**, counter `X/280` bottom-right inside the field).
- "NOT SURE WHERE TO START? TRY ONE:" — three suggestion chips (full-width dashed-border buttons with a sparkle icon). Clicking one fills the textarea.
  - "Hey! I'm fundraising for {Campaign} — every dollar puts me closer to our goal."
  - "Your donation keeps us in jerseys, gym time, and away-game buses. Thank you!"
  - "Any amount helps — even a $5 share feels huge when I see your name pop up. 🙏"
- Step is "complete" when message length > 0.

### Step 2 — Headshot
- Heading: **"Put a face to the ask"**
- Sub: "This image shows on your donation page, QR poster, and leaderboard avatar."
- Two-column on desktop (stacks on mobile):
  - Left: square dashed dropzone "Click to upload — JPG, PNG · 5MB max" → on click opens file picker. Once uploaded, shows preview with a small remove (X) button.
  - Right: "Tips for a great shot" muted card with bullet list (Face the camera chest up; Wear team jersey or colors; Natural light, no sunglasses; Square crop works best).
- Primary button under dropzone: **"+ Upload photo"** (also opens file picker).
- Reuses existing `pitch-media` storage upload logic from `PitchEditor.handleImageUpload`.
- Step is "complete" when an image URL is set.

### Step 3 — Record
- Heading: **"30–60 seconds. Be yourself."**
- Dark video stage (matches mock): striped slate background when idle, with mic icon and "Tap record when ready" + "Donors who watch a pitch give 3.2× more on average."
- Three prompt chips along the bottom of the stage: "Intro yourself", "Why the team matters", "The ask".
- Footer row inside stage area: "Length: **0.0s** / 60s" with a thin progress bar + a **Record / Stop** button on the right.
- Wraps the existing `VideoRecorder` component (max duration **60s**) but restyled to match this dark stage. To avoid rewriting `VideoRecorder`, render it with a custom container and add a subtle overlay for prompt chips. Keep its existing record/stop/re-record/upload behavior.
- Step is "complete" when a recorded video URL exists.

### Footer (all steps)
- Left: "**N of 3 complete**" — counts steps that have content.
- Right: `[Back]` (hidden on step 1) and:
  - Step 1, 2 → **"Continue →"** (advances; not gated — users can skip and still save partial pitch).
  - Step 3 → **"✓ Finish all 3 to save"** (always enabled; saves whatever exists, even partial). Disabled-look styling only when literally nothing has been entered across all 3 steps.

### Save behavior
- Single save on finish: invokes `save-roster-pitch` edge function with all four fields (`pitchMessage`, `pitchImageUrl`, `pitchVideoUrl: null`, `pitchRecordedVideoUrl`) — same payload shape PitchEditor already uses. The "paste a video link" option is **dropped** in this rebuild per the mockup (recording-only).
- On success: toast "Pitch saved!" and call `onSave()` to close.

### Stepper
- Pill-shaped buttons with circle number + label. Active pill = solid black/foreground bg with white text. Completed pills = same active styling but with a check; inactive = muted bg, muted text. Uses existing tokens (no hardcoded colors beyond `bg-foreground`/`bg-muted`).

### Typography
- All headings use the project's existing serif heading font (`font-serif` if present, otherwise inherit from `h2`/`h3` defaults already used in dialogs). Body uses default sans. We will NOT introduce new fonts — reuse whatever `Dialog`/`h2` already render with.

## Wire-up changes

### `src/components/player/RecordPitchDialog.tsx`
- Replace `<PitchEditor …/>` with `<PitchWizard …/>`. Keep the same props interface (`campaignId`, `campaignName`, `initialPitch`, `onSaved`).
- Drop the existing `<DialogHeader>` (title/description) — the wizard renders its own header with the "Build your pitch — {name}" title and subhead, matching the mock. Make `DialogContent` use `max-w-2xl p-0` so the wizard can render its own padded sections (header / stepper / body / footer) with dividers.

### `src/pages/MyFundraising.tsx` (inline pitch editor)
- The inline expand-in-place `PitchEditor` (lines ~1215–1230) is replaced with an `onClick` that opens the same `RecordPitchDialog` (state already exists pattern in `PlayerDashboard`). This unifies the experience: clicking "Record pitch" or "Re-record" anywhere always opens the wizard modal instead of expanding inline. The `isPitchOpen` toggle becomes a `dialogOpen` boolean; the `Separator` + inline editor block is removed.

### Files unchanged
- `VideoRecorder.tsx` — reused as-is inside Step 3.
- `save-roster-pitch` edge function — payload unchanged.
- `CampaignPitchEditor.tsx`, `CampaignPitchSection.tsx`, `AddCampaignForm.tsx` — org-side flow untouched.
- `PitchEditor.tsx` — left in place but no longer referenced by player flows; safe to delete in a follow-up if desired.

## Out of scope
- Persisting partial progress between sessions (wizard state lives only in the open dialog).
- Adding back the "paste YouTube/Vimeo link" option for players (intentionally removed per mockup).
- Restyling `VideoRecorder`'s internal controls beyond its outer container.
- Any change to org-level campaign pitch editor.

## Files touched
1. `src/components/player/PitchWizard.tsx` — **new** 3-step wizard component.
2. `src/components/player/RecordPitchDialog.tsx` — swap `PitchEditor` → `PitchWizard`, adjust dialog padding.
3. `src/pages/MyFundraising.tsx` — replace inline `PitchEditor` expansion with `RecordPitchDialog` open state.

## Verification
- Click "Record pitch" on a player campaign card (PlayerDashboard or My Supports) → modal opens on Step 1.
- Typing message increments "N of 3 complete"; clicking a suggestion chip fills the textarea.
- Continue → Step 2: upload an image → preview shown, X removes it, count updates.
- Continue → Step 3: record a video up to 60s → on stop, video uploads via existing flow, count updates.
- "Finish all 3 to save" persists via `save-roster-pitch`; reopening the modal pre-fills all three steps from `initialPitch`.
- Back navigation preserves entries on prior steps.
- All headings render in the app's existing serif/sans fonts — no new font files added.

