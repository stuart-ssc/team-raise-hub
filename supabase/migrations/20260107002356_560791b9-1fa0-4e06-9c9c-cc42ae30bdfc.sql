-- Add asset_upload_deadline column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS asset_upload_deadline date;

-- Create table for defining required assets per campaign
CREATE TABLE public.campaign_required_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  asset_description text,
  file_types text[] DEFAULT ARRAY['image/png', 'image/jpeg', 'application/pdf'],
  max_file_size_mb integer DEFAULT 10,
  dimensions_hint text,
  is_required boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table for tracking uploaded assets per order
CREATE TABLE public.order_asset_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  required_asset_id uuid NOT NULL REFERENCES public.campaign_required_assets(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size_bytes bigint,
  uploaded_at timestamp with time zone DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(order_id, required_asset_id)
);

-- Enable RLS
ALTER TABLE public.campaign_required_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_asset_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_required_assets
CREATE POLICY "Anyone can view required assets for campaigns"
ON public.campaign_required_assets
FOR SELECT
USING (true);

CREATE POLICY "Org users can manage required assets"
ON public.campaign_required_assets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    JOIN public.groups g ON c.group_id = g.id
    JOIN public.organization_user ou ON g.organization_id = ou.organization_id
    WHERE c.id = campaign_required_assets.campaign_id
    AND ou.user_id = auth.uid()
  )
);

-- RLS policies for order_asset_uploads
-- Use user_id from orders instead of email matching
CREATE POLICY "Order owners can view their uploads"
ON public.order_asset_uploads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_asset_uploads.order_id
    AND o.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.campaigns c ON o.campaign_id = c.id
    JOIN public.groups g ON c.group_id = g.id
    JOIN public.organization_user ou ON g.organization_id = ou.organization_id
    WHERE o.id = order_asset_uploads.order_id
    AND ou.user_id = auth.uid()
  )
);

CREATE POLICY "Order owners can insert their uploads"
ON public.order_asset_uploads
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_asset_uploads.order_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Order owners can update their uploads"
ON public.order_asset_uploads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_asset_uploads.order_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Order owners can delete their uploads"
ON public.order_asset_uploads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_asset_uploads.order_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Org users can manage order uploads"
ON public.order_asset_uploads
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.campaigns c ON o.campaign_id = c.id
    JOIN public.groups g ON c.group_id = g.id
    JOIN public.organization_user ou ON g.organization_id = ou.organization_id
    WHERE o.id = order_asset_uploads.order_id
    AND ou.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_campaign_required_assets_campaign_id ON public.campaign_required_assets(campaign_id);
CREATE INDEX idx_order_asset_uploads_order_id ON public.order_asset_uploads(order_id);
CREATE INDEX idx_order_asset_uploads_required_asset_id ON public.order_asset_uploads(required_asset_id);

-- Create storage bucket for sponsor assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-assets', 'sponsor-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sponsor-assets bucket
CREATE POLICY "Anyone can view sponsor assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'sponsor-assets');

CREATE POLICY "Authenticated users can upload sponsor assets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'sponsor-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own sponsor assets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'sponsor-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own sponsor assets"
ON storage.objects
FOR DELETE
USING (bucket_id = 'sponsor-assets' AND auth.uid()::text = (storage.foldername(name))[1]);