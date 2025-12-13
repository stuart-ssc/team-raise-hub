# Sitemap Generation

This project includes a sitemap generation script that creates static XML sitemaps for all schools and districts.

## Quick Start

Run the sitemap generator:

```bash
npx tsx scripts/generate-sitemaps.ts
```

This will create:
- `public/sitemap.xml` - Sitemap index
- `public/sitemap-static.xml` - Marketing pages (already exists)
- `public/sitemap-states.xml` - State landing pages (already exists)
- `public/sitemap-districts.xml` - All ~16,600 district pages
- `public/sitemap-schools-{state}.xml` - Per-state school sitemaps (~93,000 total schools)

## What Gets Generated

| File | Description | URLs |
|------|-------------|------|
| sitemap-static.xml | Core marketing pages | ~12 |
| sitemap-states.xml | State landing pages | 50 |
| sitemap-districts.xml | All district pages | ~16,600 |
| sitemap-schools-*.xml | Per-state school files | ~93,000 total |

## When to Run

Run this script:
- Before deploying to production
- After adding new schools/districts to the database
- Periodically to keep sitemaps fresh

## Technical Details

The script:
1. Connects to Supabase using the anon key (read-only access)
2. Fetches all schools and districts with slugs
3. Generates properly formatted XML sitemaps
4. Writes files to `public/` directory

Files are committed to the repo and served as static assets.
