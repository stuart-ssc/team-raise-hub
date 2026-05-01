## Fix: "website" column not found error

**Root cause**: `src/components/AddOrganizationDialog.tsx` inserts into a `website` column on the `organizations` table, but the actual column is named `website_url`.

**Change**: In the `onSubmit` insert payload, replace:
```ts
website: data.website || null,
```
with:
```ts
website_url: data.website || null,
```

The form field name stays `website` — only the Supabase insert key changes. One-line fix.