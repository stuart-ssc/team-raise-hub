

# AI-Guided Campaign Creation Tool

## Overview

A conversational AI assistant at `/dashboard/campaigns/ai-builder` that helps org users create fundraising campaigns through a chat interface. The AI extracts campaign fields from natural language, shows a live preview of the campaign being built, and creates a draft campaign that opens in the existing CampaignEditor.

## Architecture

```text
/dashboard/campaigns
    │
    │  [+ Add Campaign ▼]  ← dropdown replaces single button
    │       ├─ Create manually   →  /dashboard/campaigns/new
    │       └─ Create with AI    →  /dashboard/campaigns/ai-builder
    ▼
/dashboard/campaigns/ai-builder
┌─────────────────────────────────────────────────┐
│  LEFT (3/5): Live preview    │ RIGHT (2/5): Chat │
│  - Campaign name/type/group  │ - Message bubbles  │
│  - Progress bar              │ - Input + send     │
│  - Field details grid        │ - Typing indicator │
│  - "Create draft" button     │                    │
└─────────────────────────────────────────────────┘
    │  Create draft → INSERT into campaigns → redirect to editor
```

## Implementation Phases

### Phase 1: Campaign Schema Definition
Create `src/lib/ai/campaignSchema.ts` with field definitions (type, label, required, validation, AI descriptions) for shared and type-specific fields. This is the single source of truth for what the AI collects.

### Phase 2: Edge Function (`ai-campaign-builder`)
Create `supabase/functions/ai-campaign-builder/index.ts`:
- Receives conversation history, collected fields, campaign types, user groups
- Builds a system prompt instructing the AI to extract fields only (no copywriting)
- Uses Lovable AI Gateway (`google/gemini-2.5-flash`) with structured tool calling
- Server-side readiness computation (never trusts LLM for state)
- Returns: assistant message, updated collected fields, missing keys, readyToCreate flag
- Handles 429/402 errors gracefully

### Phase 3: Frontend Components
**3a. `src/pages/AICampaignBuilder.tsx`** -- Main page with two-column layout (preview left, chat right; stacked on mobile). Manages state: messages, collected fields, resolvedTypeName. Loads campaign_type and groups on mount. Handles draft creation (INSERT into campaigns, redirect to editor).

**3b. `src/components/ai-campaign/AIChatPanel.tsx`** -- Chat UI with message bubbles (user right, assistant left), textarea input (Enter sends, Shift+Enter newlines), typing indicator, auto-scroll.

**3c. `src/components/ai-campaign/AICampaignPreview.tsx`** -- Live preview panel showing campaign name, type/group badges, slug, progress bar, and a details grid with each field's status (value, "Needed" in amber, or "---" for optional). Subtle animations on value changes.

### Phase 4: Route and Button Wiring
- Add route `/dashboard/campaigns/ai-builder` in `src/App.tsx` (line ~184)
- Convert "Add Campaign" button in `src/pages/Campaigns.tsx` (line 306) to a DropdownMenu with "Create manually" and "Create with AI" options

### Phase 5: Deploy and Test
Deploy edge function, test the full flow end-to-end.

## Files Created
- `src/lib/ai/campaignSchema.ts`
- `src/pages/AICampaignBuilder.tsx`
- `src/components/ai-campaign/AIChatPanel.tsx`
- `src/components/ai-campaign/AICampaignPreview.tsx`
- `supabase/functions/ai-campaign-builder/index.ts`

## Files Modified
- `src/App.tsx` -- add one route
- `src/pages/Campaigns.tsx` -- button to dropdown menu

## Key Design Decisions
- **No streaming** for v1 -- responses are short (1-2 sentences), non-streaming invoke is simpler
- **No persistence** -- conversation state lives in React; refreshing loses progress (acceptable for v1)
- **Campaign items excluded** -- user adds tiers/products in CampaignEditor after draft creation
- **Slug collision handling** -- graceful error toast + suggest retry with suffix
- **LOVABLE_API_KEY** already available as a secret (verified)

## Out of Scope (v1)
Campaign items/tiers, pitch content, custom fields, required assets, roster attribution, conversation persistence, voice/file input, AI-generated copy

