

# School URL Matcher Tool - System Admin

## What It Does

Upload any CSV that has a school name column. The tool matches school names against the database, then gives you back the exact same CSV with one new column added: `landing_page_url`. No data is changed, no database updates -- just a lookup and append.

## User Flow

1. Click "Match Schools to URLs" on the School Import page
2. Upload your CSV
3. Pick which column is the school name (and optionally which column is the state)
4. Click "Match"
5. See a summary (e.g., "42 of 50 matched")
6. Download the enriched CSV -- all original columns untouched, plus `landing_page_url` and `match_status` appended

## Matching Logic

- Case-insensitive match of the CSV school name against `schools.school_name` in the database
- If a state column is provided, results are filtered by state for accuracy
- Matched rows get a URL like `https://sponsorly.io/schools/georgia/toombs-county-high-school-lyons`
- Unmatched rows get an empty `landing_page_url` and `match_status` = "not_found"
- All original CSV columns and values are preserved exactly as uploaded

## Technical Details

### Files

| File | Change |
|------|--------|
| `src/components/SchoolUrlMatcherDialog.tsx` | New component -- CSV upload, column picker, matching, download |
| `src/pages/SystemAdmin/SchoolImport.tsx` | Add card + button to open the matcher dialog |

### How Matching Works (all client-side)

1. Parse CSV with `papaparse` (already installed)
2. User selects which header is the school name (and optionally state)
3. Query `schools` table from Supabase: `select('school_name, slug, state, city')`
4. Build a lookup map: `normalized_school_name + state -> slug`
5. For each CSV row, look up the school and construct the URL using `stateUtils` to convert abbreviation to slug
6. Append `landing_page_url` and `match_status` columns to each row
7. Generate CSV from the enriched data and trigger browser download

### URL Format

```
https://sponsorly.io/schools/{state-slug}/{school-slug}
```

- `state-slug`: full state name, lowercase, hyphenated (e.g., "georgia") -- derived using existing `getStateName()` from `stateUtils.ts`
- `school-slug`: from the `schools.slug` column in the database

### No Database Changes

The tool is read-only. It queries the `schools` table to find matches but never writes anything. The downloaded CSV contains all original data exactly as uploaded, with the URL column appended.

