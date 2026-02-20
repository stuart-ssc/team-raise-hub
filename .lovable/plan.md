

# Fix: Verification Document Upload RLS Policy

## Problem

The `verification-documents` storage bucket has an INSERT policy that requires the uploading user to already be an `organization_admin` in the `organization_user` table. During registration, the user is uploading their verification document as part of the setup flow -- but because the organization creation itself was failing (the RLS issue we just fixed), the `organization_user` record never got created either. Even now with the org creation fix, the timing may still be tight.

More importantly, the upload policy checks `organization_admin` permission level via a join to `organization_user` and `user_type`. For the registration flow, we need to allow authenticated users to upload to their own folder.

**Current policy** (INSERT):
```
bucket_id = 'verification-documents'
AND auth.uid() = folder_name
AND EXISTS (organization_user with organization_admin permission)
```

## Fix

Add a broader INSERT policy that allows any authenticated user to upload files into their own user-ID folder in the `verification-documents` bucket. The folder-based scoping (`auth.uid() = folder_name`) already prevents users from uploading to other users' folders, so this is safe.

### Database Migration

```sql
CREATE POLICY "Authenticated users can upload verification documents to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
```

This policy works alongside the existing one. The existing org-admin policy can remain (it won't conflict). The new policy simply relaxes the requirement so registration uploads succeed.

No code changes needed -- `DocumentUpload.tsx` already uploads to `{userId}/timestamp.pdf` which matches the folder-based check.

