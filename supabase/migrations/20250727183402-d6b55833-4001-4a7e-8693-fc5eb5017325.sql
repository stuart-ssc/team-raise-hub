-- Create storage bucket for campaign item images
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-item-images', 'campaign-item-images', true);

-- Create policies for campaign item images
CREATE POLICY "Campaign item images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'campaign-item-images');

CREATE POLICY "Users with qualifying roles can upload campaign item images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'campaign-item-images' AND
  EXISTS (
    SELECT 1 
    FROM school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id)
    WHERE su.user_id = auth.uid() 
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

CREATE POLICY "Users with qualifying roles can update campaign item images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'campaign-item-images' AND
  EXISTS (
    SELECT 1 
    FROM school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id)
    WHERE su.user_id = auth.uid() 
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);

CREATE POLICY "Users with qualifying roles can delete campaign item images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'campaign-item-images' AND
  EXISTS (
    SELECT 1 
    FROM school_user su
    JOIN user_type ut ON (su.user_type_id = ut.id)
    WHERE su.user_id = auth.uid() 
    AND ut.name IN ('Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader')
  )
);