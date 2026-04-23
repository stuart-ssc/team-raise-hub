

## Goal
Replace user-facing "campaign" wording with "fundraiser" everywhere the AI Assistant shows it — chat header, intro screen, preview card, button labels, schema field labels, and the AI assistant's spoken/written messages from the edge function. Internal code identifiers (table names, field keys like `campaign_type_id`, route paths, tool names like `create_campaign_draft`) stay unchanged.

## Scope
Only **user-visible strings**. No schema, route, table, column, or tool-name renames. Memory rule already says: brand uses "fundraiser" / "donation" (not "campaign"/"order").

## Changes

### 1. `src/components/ai-campaign/AIChatPanel.tsx`
- Header title: `"AI Campaign Assistant"` → `"AI Fundraiser Assistant"`.
- Empty state copy: `"Tell me about the campaign you'd like to create!"` → `"Tell me about the fundraiser you'd like to create!"`.
- Default `placeholder` prop: `"Describe your campaign..."` → `"Describe your fundraiser..."`.

### 2. `src/components/ai-campaign/AICampaignPreview.tsx`
- Panel header: `"Campaign Preview"` → `"Fundraiser Preview"`.
- Cover image alt: `"Campaign cover"` → `"Fundraiser cover"`.
- Untitled placeholder: `"Untitled Campaign"` → `"Untitled Fundraiser"`.
- Items card title: `Campaign {itemNoun}s` → `Fundraiser {itemNoun}s`.
- Extended-details row label: `"Campaign image"` → `"Fundraiser image"`.
- Bottom action buttons: `"Publish Campaign"` → `"Publish Fundraiser"`, `"Create Draft Campaign"` → `"Create Draft Fundraiser"`, `"Creating Draft..."` unchanged.

### 3. `src/components/ai-campaign/ImageUploadPrompt.tsx`
- Default `label` prop: `"Upload campaign image"` → `"Upload fundraiser image"`.
- `<img alt="Campaign" />` → `alt="Fundraiser"`.

### 4. `src/pages/AICampaignBuilder.tsx`
- Breadcrumb segment already says "Fundraisers" — no change.
- Initial greeting strings:
  - `"Hi! I'm here to help you set up a new campaign for **${name}**. What kind of fundraiser are you planning?"` → `"Hi! I'm here to help you set up a new fundraiser for **${name}**. What kind of fundraiser are you planning?"`.
  - The other greeting (no known group) → "...help you set up a new fundraiser. Tell me about what you're planning..."
- Suggestions `label: "Campaign type"` → `"Fundraiser type"` (initial chip card).
- `getChatPlaceholder` fallback: `"Describe your campaign..."` → `"Describe your fundraiser..."`.
- Post-draft transition message (the one built client-side after `handleCreateDraft` and after edge-function `createdCampaignId`): replace both occurrences of `"campaign image"` and `"Campaign image"` with `"fundraiser image"` / `"Fundraiser image"`. Keep the `name` variable.
- Toast titles already brand-neutral; the slug-conflict toast: `"A campaign with a similar name already exists..."` → `"A fundraiser with a similar name already exists..."`.
- `CampaignPublicationControl campaignName={collectedFields.name || "Campaign"}` → fallback `"Fundraiser"`.

### 5. `src/lib/ai/campaignSchema.ts` (preview row labels — these are what the screenshot shows)
Update **`label` values only** (keep `key` unchanged):
- `Campaign Name` → `Fundraiser Name`
- `Campaign Type` → `Fundraiser Type`
- (others — Group, Description, Goal Amount, Start Date, End Date, Requires Business Info, Platform Fee Model — already brand-neutral; leave as-is)

### 6. `supabase/functions/ai-campaign-builder/index.ts` (assistant-spoken / chip-label strings)

User-visible strings to update — leave all keys, tool names, regex patterns, and `aiDescription` text unchanged:

- Suggestion chip labels:
  - `label: "Campaign image"` (two places, lines ~1196 and ~2060) → `"Fundraiser image"`.
  - `label: "Campaign type"` (line ~2119) → `"Fundraiser type"`.
  - Asset-deadline option labels: `"2 weeks before campaign end"`, `"1 week before campaign end"`, `"Same as campaign end date"` → replace `campaign` with `fundraiser`.
- `FIELD_DEFS` labels (mirrors front-end schema — used in any server-rendered summaries):
  - `"Campaign Name"` → `"Fundraiser Name"`, `"Campaign Type"` → `"Fundraiser Type"`.
- Hard-coded assistant messages (deterministic, server-emitted):
  - `"I still need an answer for the campaign image — please upload one or click Skip."` → `"...fundraiser image..."`.
  - `assistantMessage = \`Your campaign is created. 🎉\\n\\nNow let's add your first ${itemNoun}...` → `Your fundraiser is created.`.
  - Slug-conflict error: `"A campaign with a similar name already exists. Try a slightly different name."` → `"A fundraiser with a similar name already exists..."`.
  - 3-bubble fee explanation (line ~2256–2258): keep "donation" wording in the dollar examples; no "campaign" present — no change needed beyond a sanity check.
- System-prompt guidance text inside `buildSystemPrompt` and `buildItemsSystemPrompt` — these instruct the model what to *say*. Update the **example phrases the model is told to mimic** so the model stops echoing "campaign" in its replies:
  - `"You are a campaign creation assistant for Sponsorly..."` → `"You are a fundraiser creation assistant for Sponsorly..."` (both pre-draft and post-draft system prompts).
  - `"... help the user set up a new fundraising campaign ..."` → `"... help the user set up a new fundraiser ..."`.
  - Example acknowledgments: `"Great, I'll set this up as a **Sponsorship** campaign."` → `"... as a **Sponsorship** fundraiser."`.
  - `"What's the name of this campaign?"` example → `"What's the name of this fundraiser?"`.
  - `"What type of campaign is this?"` example → `"What type of fundraiser is this?"`.
  - Description prompt example: `"Want to add a short description of the campaign?..."` → `"...of the fundraiser?..."`.
  - Post-draft "campaign image" mentions in `nextStep` strings → "fundraiser image".
  - The `${campaignName}` template variable name in `buildItemsSystemPrompt` stays (internal); update the surrounding sentence: `"The user just created the campaign **"${campaignName}"** and is now adding..."` → `"The user just created the fundraiser **"${campaignName}"**..."`.
  - "About sponsorship items" section, "campaign materials" wording in tool descriptions / asset definitions: leave `aiDescription` strings alone where they're internal model guidance about data shape; only update phrases the model is likely to echo verbatim to the user.

Edge-function deployment: the file lives under `supabase/functions/`, so editing it triggers a redeploy automatically — no manual step needed.

## Verification
- `/dashboard/fundraisers/ai-builder` page header reads "AI Fundraiser Assistant".
- Right-pane preview card title is "Fundraiser Preview"; placeholder name is "Untitled Fundraiser".
- Detail rows in the preview show "Fundraiser Name *" and "Fundraiser Type *" (matching screenshot — currently "Campaign Name" / "Campaign Type").
- Initial greeting bubble starts with "Hi! I'm here to help you set up a new fundraiser for **{Group}**..."
- Chip card label above the type buttons reads "Fundraiser type".
- Image-upload widget label reads "Upload fundraiser image".
- Bottom CTA reads "Create Draft Fundraiser" (and later "Publish Fundraiser").
- Conversational AI replies use "fundraiser" instead of "campaign" in new sessions (bounded by the model — example phrases in the system prompt now use "fundraiser", which is what the model mimics).
- Existing routes, tool names (`create_campaign_draft`, `update_campaign_fields`, `save_campaign_item`), table names (`campaigns`, `campaign_items`, `campaign_type`), and field keys (`campaign_type_id`, `campaignId` props) are unchanged — no functional regressions.

