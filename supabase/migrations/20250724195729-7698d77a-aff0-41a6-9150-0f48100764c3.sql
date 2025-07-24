-- Create storage bucket for group logos
INSERT INTO storage.buckets (id, name, public) VALUES ('group-logos', 'group-logos', true);

-- Create storage policies for group logos
CREATE POLICY "Group logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'group-logos');

CREATE POLICY "Users can upload group logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'group-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their group logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'group-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their group logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'group-logos' 
  AND auth.role() = 'authenticated'
);