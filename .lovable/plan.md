

## Goal
Extend the donor CSV import so a participant (or admin) can include the company/business name (and optional business contact fields) for each donor. On import, we'll find or create the business, link it to the donor via `business_donors`, and link it to the organization via `organization_businesses` — attributing ownership to the uploader just like donors today.

## CSV template — new optional columns
Existing required column: `email`. New optional columns (all optional, all skipped if blank for a row):
- `company_name` *(primary trigger — if blank, no business is created/linked for that row)*
- `company_role` *(donor's role at the company, e.g. "Owner", "Marketing Manager"; defaults to "contact")*
- `company_email`
- `company_phone`
- `company_website`
- `company_industry`
- `company_city`
- `company_state`

Updated `downloadTemplate()` sample row in `DonorImportWizard.tsx` will include these columns with example data so users can see the format.

## Wizard UI — `src/components/DonorImportWizard.tsx`

1. **`DONOR_FIELDS` list** gets the new business fields appended (with a "Company" group label visible in the select):
   - `company_name` "Company Name"
   - `company_role` "Company Role / Title"
   - `company_email` "Company Email"
   - `company_phone` "Company Phone"
   - `company_website` "Company Website"
   - `company_industry` "Company Industry"
   - `company_city` "Company City"
   - `company_state` "Company State"
2. **Auto-mapping** in `handleFileUpload` recognises common headers: anything containing "company" or "organization" → `company_name`; "title"/"role" → `company_role`; "industry", "website", "city", "state" with "company"/"business" prefix → respective field.
3. **Preview step** already iterates `DONOR_FIELDS` — new columns appear automatically when mapped. To avoid an overly wide preview table, only the fields actually mapped show up (current behavior).
4. **Step 1 alert copy** updated: "Optionally include the donor's company so we can group supporters by business and personalize outreach."
5. **`handleImport` payload** sends the same flat `donor` object — the new fields ride along under the same shape; the edge function reads them.

## Edge function — `supabase/functions/import-donors/index.ts`

New per-row logic *after* the donor profile is inserted/updated, only when `donor.company_name` is non-empty:

1. **Find or create the business** (scoped by name within the org's reachable businesses):
   - Look up existing `businesses` row by `LOWER(business_name) = LOWER(company_name)` AND linked to `organizationId` via `organization_businesses`. If found, reuse.
   - Otherwise insert a new `businesses` row with the supplied fields, `verification_status = 'unverified'`, and `added_by_organization_user_id = callerOrgUserId`.
   - When creating, also insert into `organization_businesses` with `relationship_status = 'active'`. (Existing match: leave as-is; if no link exists yet, add one.)
2. **Update business fields** (only when business already existed): fill in *only blank* fields from the CSV — never overwrite non-null values. This prevents one user's import from clobbering another's curated business data.
3. **Link donor ↔ business** via `business_donors`:
   - Upsert `(business_id, donor_id, organization_id)` with `role = company_role || 'contact'`, `auto_linked = false`.
   - Use `onConflict: 'business_id,donor_id,organization_id'` (verify constraint exists; if not, do a SELECT-then-INSERT). I'll add a unique index in a small migration if missing.
4. **Errors**: business/link failures don't fail the donor import — they're added to `result.errors` with row + email + a clear message ("Donor imported, but failed to link company: <reason>") and the donor still counts as imported/updated.
5. **Return shape unchanged** — `importedDonorIds` still drives the optional "add to list" step. (We deliberately don't add `importedBusinessIds` for this iteration; not needed by the UI.)

## DB safety check
Confirm a unique index on `business_donors(business_id, donor_id, organization_id)`. If absent, add one in a migration alongside this work so the upsert is safe.

## Visibility for participants
The existing `useParticipantConnections` hook already includes businesses where `added_by_organization_user_id ∈ orgUserIds` and links via `business_donors.linked_by`. To keep parity:
- Set `business_donors.linked_by = user.id` (caller's `auth.users.id`) on every link insert. The hook's `linked_by = auth.uid()` clause then picks them up immediately.
- Newly-created businesses already get `added_by_organization_user_id`, so they'll appear on the participant's Businesses page right after import.

## Out of scope
- Multi-row "company has multiple contacts" reconciliation beyond the simple find-or-create (that's already what business_donors supports — multiple donors can share a business, no special handling needed).
- Editing companies inside the import wizard preview.
- Importing logo, address line 2, country, EIN, or full address — kept minimal to a useful subset; admins can fill in the rest later.
- Changing the existing Add to List step.

## Files touched
1. `src/components/DonorImportWizard.tsx` — add 8 company fields to `DONOR_FIELDS`, expand auto-mapping heuristics, update template download, update step 1 copy.
2. `supabase/functions/import-donors/index.ts` — accept new fields on the row interface; after donor upsert, find-or-create business, link to organization, link to donor with `linked_by` and `added_by_organization_user_id` set; non-fatal error reporting.
3. `supabase/migrations/<new>.sql` — add unique index on `business_donors(business_id, donor_id, organization_id)` only if it doesn't already exist.

## Verification
- Download the template — it now contains a `company_name` column and the other `company_*` columns with example data ("Acme Co", "Owner", etc.).
- Upload a CSV where two rows share the same `company_name` ("Acme Co") with different donor emails — both donors are imported; one new `businesses` row is created; both donors appear in `business_donors` linked to that single Acme business; the business is linked to the org via `organization_businesses`.
- Re-upload with `company_email` filled but the existing Acme record already has an email — Acme's email is **not** overwritten.
- A participant uploads donors with companies — the new businesses immediately appear on their `/dashboard/businesses` page, and the donors appear on `/dashboard/donors` with the company shown via the existing donor → business link.
- Admin sees the same records and can re-assign donor ownership as before; business ownership column is populated with the original uploader.
- A row with no `company_name` still imports the donor cleanly and creates no business.

