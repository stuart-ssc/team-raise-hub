

The user wants three fixes to the AI Campaign Builder:

1. **Terminology**: Replace "peer-to-peer fundraising" language with the correct concept — each roster member gets an individual goal and a personalized URL to track their contributions.
2. **Single-roster shortcut**: If the group has only one roster, default to it and just confirm ("I'll attribute donations to your **[Roster Name]** roster — sound good?") instead of asking the user to pick.
3. **Missing question**: The AI skipped asking about `requires_business_info` before prompting to save the draft. It should be asked during the collection phase.

Let me confirm by checking the edge function's system prompt and how rosters are currently fetched.

## Plan

### File: `supabase/functions/ai-campaign-builder/index.ts`

**1. Fix terminology in the system prompt (post-draft section)**
- Remove all "peer-to-peer" language.
- Replace with: "Roster attribution gives each roster member an individual fundraising goal and a personalized URL so they can track their own contributions to the campaign."
- When asking the user, phrase it as: "Want to enable individual goals and personalized URLs for each roster member?" (yes/no).

**2. Smart roster default**
- The function already fetches rosters for the group when `campaignId` is set (post-draft phase). Extend this:
  - If `rosters.length === 1`: include in the system prompt: "The group has exactly one roster: **[name]** (id: [id]). When the user enables roster attribution, automatically use this roster_id and just confirm with them — do NOT ask them to choose."
  - If `rosters.length > 1`: keep current behavior (offer numbered choices).
  - If `rosters.length === 0`: tell the AI to skip roster attribution and explain why.

**3. Add `requires_business_info` to the collection phase**
- Update the system prompt's collection-phase checklist so the AI explicitly asks: "Will donors purchase as a business (for sponsor recognition / tax records)?" before calling `create_campaign_draft`.
- Add `requires_business_info` to the list of fields the AI must collect/confirm before transitioning to `ready_to_create`.
- The field already exists in the tool schema and frontend insert path — just need to make the AI ask for it.
- Suggest yes/no chips when asking.

### Out of scope
- No frontend changes needed — the edge function changes flow through the existing message/suggestion pipeline.
- Roster fetching logic already exists; only the prompt instructions need updating.

