import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, X, Globe, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LandingPagePreview } from './LandingPagePreview';
import { LandingPageBlock } from './types';
import { buildTemplateVariables } from './resolveTemplateVariables';

interface EntityData {
  id: string;
  name: string;
  city?: string;
  state?: string;
  slug?: string;
}

interface PageConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'school' | 'district';
  entity: EntityData;
  existingConfigId?: string;
  onSaved?: () => void;
}

export function PageConfigDialog({
  open,
  onOpenChange,
  entityType,
  entity,
  existingConfigId,
  onSaved,
}: PageConfigDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch templates for entity type
  const { data: templates = [] } = useQuery({
    queryKey: ['landing-page-templates', entityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_templates')
        .select('id, name, description, blocks, is_default')
        .eq('template_type', entityType)
        .order('is_default', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
  
  // Fetch existing config if editing
  const { data: existingConfig } = useQuery({
    queryKey: ['landing-page-config', existingConfigId],
    queryFn: async () => {
      if (!existingConfigId) return null;
      
      const { data, error } = await supabase
        .from('landing_page_configs')
        .select('*')
        .eq('id', existingConfigId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!existingConfigId,
  });
  
  // Load existing config data
  useEffect(() => {
    if (existingConfig) {
      setSelectedTemplateId(existingConfig.template_id);
      setSeoTitle(existingConfig.seo_title || '');
      setSeoDescription(existingConfig.seo_description || '');
      setOgImageUrl(existingConfig.og_image_url || '');
      setIsPublished(existingConfig.is_published || false);
    } else {
      // Set defaults for new config
      const defaultTemplate = templates.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
      setSeoTitle(`${entity.name} - Support Our Programs`);
      setSeoDescription(`Support ${entity.name} in ${entity.city}, ${entity.state}. Browse active fundraising campaigns and make a difference today.`);
    }
  }, [existingConfig, templates, entity]);
  
  // Get selected template blocks
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const templateBlocks: LandingPageBlock[] = selectedTemplate?.blocks 
    ? (Array.isArray(selectedTemplate.blocks) ? selectedTemplate.blocks as unknown as LandingPageBlock[] : [])
    : [];
  
  // Build preview variables
  const previewVariables = buildTemplateVariables(
    entityType,
    {
      name: entity.name,
      city: entity.city,
      state: entity.state,
    },
    {
      total_raised: 125000,
      campaign_count: 5,
      active_campaign_count: 2,
      supporter_count: 150,
      group_count: 8,
    }
  );
  
  const handleSave = async (publish: boolean = false) => {
    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const configData = {
        entity_type: entityType,
        entity_id: entity.id,
        template_id: selectedTemplateId,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        og_image_url: ogImageUrl || null,
        is_published: publish ? true : isPublished,
        published_at: publish ? new Date().toISOString() : (isPublished ? existingConfig?.published_at : null),
        published_by: publish ? user?.id : (isPublished ? existingConfig?.published_by : null),
      };
      
      if (existingConfigId) {
        const { error } = await supabase
          .from('landing_page_configs')
          .update(configData)
          .eq('id', existingConfigId);
        
        if (error) throw error;
        toast.success('Page configuration updated');
      } else {
        const { error } = await supabase
          .from('landing_page_configs')
          .insert(configData);
        
        if (error) throw error;
        toast.success('Page configuration created');
      }
      
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };
  
  const previewUrl = entity.slug 
    ? `/${entityType === 'school' ? 'schools' : 'districts'}/${entity.slug}`
    : undefined;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">
                Configure Landing Page
              </h2>
              <p className="text-sm text-muted-foreground">
                {entity.name} • {entity.city}, {entity.state}
              </p>
            </div>
            {isPublished && (
              <Badge variant="default" className="ml-2">Published</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={isSaving}>
              {isPublished ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Update & Publish
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Save & Publish
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel - Configuration */}
          <div className="w-[400px] border-r flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Template Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Template</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            {template.name}
                            {template.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate?.description && (
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  )}
                </div>
                
                <Separator />
                
                {/* SEO Settings */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">SEO Settings</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="seo-title">Page Title</Label>
                    <Input
                      id="seo-title"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="Enter page title"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {seoTitle.length}/60 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="seo-description">Meta Description</Label>
                    <Textarea
                      id="seo-description"
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="Enter meta description"
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {seoDescription.length}/160 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="og-image">Social Share Image URL</Label>
                    <Input
                      id="og-image"
                      value={ogImageUrl}
                      onChange={(e) => setOgImageUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 1200x630 pixels
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Publication Status */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Publication</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="published">Published</Label>
                      <p className="text-sm text-muted-foreground">
                        Make this page publicly accessible
                      </p>
                    </div>
                    <Switch
                      id="published"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                  </div>
                  
                  {existingConfig?.published_at && (
                    <p className="text-xs text-muted-foreground">
                      Last published: {new Date(existingConfig.published_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <Separator />
                
                {/* Preview Stats */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Preview Data</Label>
                  <p className="text-sm text-muted-foreground">
                    The preview uses sample data. Real statistics will be calculated from actual campaigns and donations.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-muted-foreground text-xs">Total Raised</div>
                      <div className="font-medium">$1,250</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-muted-foreground text-xs">Campaigns</div>
                      <div className="font-medium">5</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-muted-foreground text-xs">Supporters</div>
                      <div className="font-medium">150</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-muted-foreground text-xs">Groups</div>
                      <div className="font-medium">8</div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
          
          {/* Right panel - Preview */}
          <div className="flex-1 overflow-hidden">
            <LandingPagePreview
              blocks={templateBlocks}
              variables={previewVariables}
              previewUrl={previewUrl}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
