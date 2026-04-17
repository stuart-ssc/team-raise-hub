

The user wants the AI's responses to be split into two clearly separated parts:
1. **Acknowledgment** of what was just selected/saved (e.g., "Great, I'll set this up as a Sponsorship campaign.")
2. **Next question** as its own paragraph (e.g., "What's the name of this campaign?")

Currently both run together as one sentence/paragraph. ReactMarkdown is already used to render assistant messages, so a blank line between the two will produce two visually distinct paragraphs.

## Fix (one file: `supabase/functions/ai-campaign-builder/index.ts`)

Update the system prompt to require this two-part response format for every turn after a user provides input.

### Add a new explicit formatting rule
Insert into the rules section (e.g., as Rule 15 or appended to Rule 9):

> **Response format — every turn must be two separated paragraphs:**
> 1. **Acknowledgment paragraph** — confirm what the user just provided (e.g., "Great, I'll set this up as a Sponsorship campaign." / "Got it — goal of $5,000." / "Saved.")
> 2. **Next question paragraph** — the next single question, on its own line, separated from the acknowledgment by a blank line.
>
> Example:
> ```
> Great, I'll set this up as a Sponsorship campaign.
>
> What's the name of this campaign?
> ```
>
> Never combine the acknowledgment and the next question into one sentence. Never ask more than one question per turn. The very first greeting (no prior user input to acknowledge) is exempt — it can be a single paragraph followed by the first question on a new line.

### Why this works
- ReactMarkdown in `AIChatPanel` already renders `\n\n` as separate `<p>` blocks (the existing `prose` styling handles paragraph spacing).
- No frontend changes needed.
- Keeps all existing field-collection, skip handling, and tool-call logic intact.

### Out of scope
- No changes to `AIChatPanel`, `AICampaignPreview`, or schema files
- Greeting message in `AICampaignBuilder.tsx` stays as-is (it's the opening turn)
- Post-draft conversation flow already uses similar phrasing — Rule applies uniformly to both phases

