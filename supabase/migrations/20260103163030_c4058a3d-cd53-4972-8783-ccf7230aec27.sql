-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('message-attachments', 'message-attachments', true);

-- Storage policies for message attachments
CREATE POLICY "Anyone can view message attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update message attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete message attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');