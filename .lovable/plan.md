

## Goal
Sweep the remaining user-visible "Campaign" / "campaign" references inside the Fundraisers list page and the Fundraiser editor (basic details, items, pitch, schedule, donor experience, publication dialog, save buttons, etc.) and rename them to "Fundraiser" / "fundraiser". Internal code identifiers, DB tables, and the donor/business CRM "Outreach Campaigns" surface remain untouched (per the prior approved scope).

## Changes

### 1. `src/pages/Campaigns.tsx` (list page)
- Search input placeholder: `"Search campaigns..."` → `"Search fundraisers..."`.
- Table header `Campaign Name` → `Fundraiser Name`.

### 2. `src/pages/CampaignEditor.tsx` (editor)
- `SECTION_META` subtitles/titles:
  - details subtitle: "Campaign name, URL, and description" → "Fundraiser name, URL, and description"
  - schedule subtitle: "Set your campaign timeline and fundraising goal" → "Set your fundraiser timeline and fundraising goal"
  - items title: "Campaign Items" → "Fundraiser Items"
  - pitch title: "Campaign Pitch" → "Fundraiser Pitch"; subtitle "…for your campaign" → "…for your fundraiser"
- Header subtitle (line 517): "Manage your campaign settings and orders" → "Manage your fundraiser settings and orders"; "Set up your fundraising campaign step by step" → "Set up your fundraiser step by step"
- Save button label (lines 589, 718): "Save Campaign" / "Saving..." → "Save Fundraiser" / "Saving..."
- Toast/validation copy: "Please fill in campaign name, slug, group, and type" → "Please fill in fundraiser name, slug, group, and type"; "Failed to save campaign" → "Failed to save fundraiser"; delete `aria-label="Delete campaign"` → `"Delete fundraiser"`.

### 3. `src/components/campaign-editor/BasicDetailsSection.tsx`
- Label "Campaign Name *" → "Fundraiser Name *"; placeholder "Enter campaign name" → "Enter fundraiser name".
- URL slug placeholder `"campaign-url-slug"` → `"fundraiser-url-slug"`; helper text "This will be your campaign URL." → "This will be your fundraiser URL."
- Description placeholder "Enter campaign description" → "Enter fundraiser description".
- Label "Campaign Image" → "Fundraiser Image".
- Label "Campaign Type *" → "Fundraiser Type *".

### 4. `src/components/campaign-editor/CampaignItemsSection.tsx`
- `<CardTitle>Campaign Items</CardTitle>` → "Fundraiser Items".
- CardDescription "Products or sponsorship levels for your campaign" → "Products or sponsorship levels for your fundraiser".

### 5. `src/components/campaign-editor/ScheduleSection.tsx`
- Helper text "Optional fundraising target to display on your campaign page" → "Optional fundraising target to display on your fundraiser page".

### 6. `src/components/campaign-editor/DonorExperienceSection.tsx`
- "Choose who pays Sponsorly's 10% platform fee for this campaign." → "…for this fundraiser."
- Keep the "Sponsorship Campaign" toggle label as-is — it refers to the sponsorship campaign type concept, not the dashboard surface. (Flagging; revisit if user wants this renamed too.)

### 7. `src/components/campaign-editor/CampaignPitchSection.tsx`
- Toast description "Your campaign pitch has been saved." → "Your fundraiser pitch has been saved."
- Alert copy: "This pitch will be shown to all donors. If roster attribution is enabled, individual roster members can add their own pitch which will override this on their personal links." — replace standalone "campaign" if present (currently no occurrence; no change needed beyond the toast).

### 8. `src/components/CampaignPitchEditor.tsx`
- Visible labels: "Campaign Message" → "Fundraiser Message"; "Campaign Photo (optional)" → "Fundraiser Photo (optional)"; "Campaign Video (optional)" → "Fundraiser Video (optional)".
- Placeholder "Share why this campaign matters and how supporters can make a difference…" → "Share why this fundraiser matters and how supporters can make a difference…"
- Toast "Your campaign pitch has been updated" → "Your fundraiser pitch has been updated".
- (Internal `htmlFor`/`id` strings like `campaign-pitch-message`, `campaign-record` stay — not user-visible.)

### 9. `src/components/CampaignPublicationControl.tsx`
- Dialog title "Unpublish Campaign" / "Publish Campaign" → "Unpublish Fundraiser" / "Publish Fundraiser".
- Dialog description "This will make the campaign unavailable to the public." → "…the fundraiser unavailable…"; "This will make your campaign live and visible to donors." → "…your fundraiser live…"
- Body copy: "Organization requires verification before publishing campaigns" → "…before publishing fundraisers"; "Payment account must be configured before publishing campaigns" → "…before publishing fundraisers"; "Campaign has items configured" → "Fundraiser has items configured"; "Campaign should have at least one item before publishing" → "Fundraiser should have at least one item before publishing"; "before publishing this campaign." → "…this fundraiser."; "Existing campaign links will show that the campaign has ended." → "Existing fundraiser links will show that the fundraiser has ended."
- Footer button: "Publish Campaign" → "Publish Fundraiser".
- Toast: `Campaign ${newStatus === 'published' ? 'published' : 'saved as draft'} successfully!` → `Fundraiser ${...} successfully!`; "Failed to update campaign status" → "Failed to update fundraiser status".

### 10. `src/components/campaign-editor/RequiredAssetsEditor.tsx`
- DialogDescription "Define what file sponsors need to provide for this campaign." → "…for this fundraiser."
- Default sample asset description "Your company logo for recognition in campaign materials" → "…in fundraiser materials".

## Out of scope (explicitly unchanged)
- DB tables/columns (`campaigns`, `campaign_items`, `campaign_id`, `campaign_type`), all internal TypeScript types, component names, props, file names, query keys.
- Donor/Business CRM "Outreach Campaigns" surface (Nurture Campaigns, BusinessCampaignDialog, NewConversationDialog "Select Campaign", Reports CSV "CAMPAIGN DETAILS" header, marketing pages, AI builder chat copy).
- The "Sponsorship Campaign" toggle in Donor Experience (refers to the sponsorship-campaign mode, not the dashboard surface).

## Verification
- Fundraisers list: search placeholder reads "Search fundraisers…"; table column header reads "Fundraiser Name".
- Editing a fundraiser: header subtitle reads "Manage your fundraiser settings and orders"; primary button reads "Save Fundraiser".
- Basic Details panel labels read "Fundraiser Name", "Fundraiser Image", "Fundraiser Type"; helper text says "This will be your fundraiser URL."
- Items panel reads "Fundraiser Items" (title + nav). Pitch panel reads "Fundraiser Pitch" with "Fundraiser Message / Photo / Video" labels.
- Publish dialog title reads "Publish Fundraiser" with matching button text and copy throughout.
- Donor / business outreach surfaces (NurtureCampaigns, BusinessCampaignDialog, message composer "Select Campaign") still say "Campaign" — intentional.

