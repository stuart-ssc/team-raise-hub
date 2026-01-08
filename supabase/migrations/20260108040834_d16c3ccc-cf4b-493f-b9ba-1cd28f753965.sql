-- Add attachments column to help_submissions
ALTER TABLE public.help_submissions 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN help_submissions.attachments IS 'Array of attachment objects: [{name, url, type, size}]';

-- Create storage bucket for help attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('help-attachments', 'help-attachments', true);

-- RLS policy: Users can upload their own attachments
CREATE POLICY "Users can upload help attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'help-attachments');

-- RLS policy: Anyone can view help attachments
CREATE POLICY "Public read access for help attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'help-attachments');

-- RLS policy: System admins can delete
CREATE POLICY "System admins can delete help attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'help-attachments' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND system_admin = true)
);