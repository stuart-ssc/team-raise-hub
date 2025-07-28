-- Add slug column to campaigns table for URL paths
ALTER TABLE public.campaigns 
ADD COLUMN slug text;