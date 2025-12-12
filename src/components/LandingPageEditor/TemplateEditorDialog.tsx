import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X, Eye, Undo2, Redo2, Loader2 } from 'lucide-react';
import { LandingPageBlock, LandingPageBlockType } from './types';
import { LandingPageEditor, useTemplateEditor, useTemplateHistory } from './LandingPageEditor';
import { BlockToolbar } from './BlockToolbar';
import { VariablePicker } from './VariablePicker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
  templateType: 'school' | 'district' | 'nonprofit';
  initialData?: {
    name: string;
    description: string | null;
    blocks: LandingPageBlock[];
  };
  onSave?: () => void;
}

export function TemplateEditorDialog({
  open,
  onOpenChange,
  templateId,
  templateType,
  initialData,
  onSave,
}: TemplateEditorDialogProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [blocks, setBlocks] = useState<LandingPageBlock[]>(initialData?.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'blocks' | 'variables'>('blocks');

  const { canUndo, canRedo, pushState, undo, redo, reset } = useTemplateHistory(blocks);

  // Reset state when dialog opens with new data
  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setBlocks(initialData.blocks);
      reset(initialData.blocks);
    }
  }, [open, initialData, reset]);

  const handleBlocksChange = useCallback((newBlocks: LandingPageBlock[]) => {
    setBlocks(newBlocks);
  }, []);

  const handleAddBlock = useCallback((type: LandingPageBlockType) => {
    const newBlock: LandingPageBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      styles: getDefaultStylesForType(type),
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    pushState(newBlocks);
    setSelectedBlockId(newBlock.id);
  }, [blocks, pushState]);

  const handleUndo = useCallback(() => {
    const prevBlocks = undo();
    if (prevBlocks) {
      setBlocks(prevBlocks);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextBlocks = redo();
    if (nextBlocks) {
      setBlocks(nextBlocks);
    }
  }, [redo]);

  const handleInsertVariable = useCallback((variable: string) => {
    // Copy to clipboard for manual paste
    navigator.clipboard.writeText(variable);
    toast.success('Variable copied to clipboard');
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setIsSaving(true);
    try {
      if (templateId) {
        // Update existing template
        const { error } = await supabase
          .from('landing_page_templates')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            blocks: JSON.parse(JSON.stringify(blocks)),
            template_type: templateType,
          })
          .eq('id', templateId);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const { error } = await supabase
          .from('landing_page_templates')
          .insert({
            name: name.trim(),
            description: description.trim() || null,
            blocks: JSON.parse(JSON.stringify(blocks)),
            template_type: templateType,
          });

        if (error) throw error;
        toast.success('Template created successfully');
      }

      onSave?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-xl">
                {templateId ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Template
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Blocks & Variables */}
          <div className="w-72 border-r bg-muted/30 flex flex-col">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'blocks' | 'variables')}>
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="blocks" className="flex-1">Blocks</TabsTrigger>
                <TabsTrigger value="variables" className="flex-1">Variables</TabsTrigger>
              </TabsList>
              <TabsContent value="blocks" className="flex-1 m-0">
                <BlockToolbar onAddBlock={handleAddBlock} />
              </TabsContent>
              <TabsContent value="variables" className="flex-1 m-0">
                <VariablePicker 
                  onInsert={handleInsertVariable} 
                  templateType={templateType}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Center - Editor Canvas */}
          <div className="flex-1 flex flex-col bg-muted/10">
            <div className="p-4 border-b bg-background">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter template name..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="template-description">Description (optional)</Label>
                  <Textarea
                    id="template-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this template..."
                    className="mt-1 resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <LandingPageEditor
                initialBlocks={blocks}
                onBlocksChange={handleBlocksChange}
                onSelectionChange={setSelectedBlockId}
              />
            </div>
          </div>

          {/* Right Sidebar - Block Properties */}
          <div className="w-80 border-l bg-muted/30">
            <ScrollArea className="h-full">
              <div className="p-4">
                {selectedBlock ? (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium capitalize">
                        {selectedBlock.type.replace('-', ' ')} Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <p className="text-sm text-muted-foreground">
                        Click on a block in the editor to modify its properties inline.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a block to view properties</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultStylesForType(type: LandingPageBlockType): LandingPageBlock['styles'] {
  switch (type) {
    case 'hero':
      return {
        heroTitle: 'Welcome to {{school_name}}',
        heroSubtitle: 'Supporting our community through fundraising',
        heroBackgroundColor: '#1e40af',
        heroHeight: '400px',
        heroOverlayOpacity: '0.5',
        textAlign: 'center',
      };
    case 'heading':
      return { fontSize: '2rem', fontWeight: 'bold', textAlign: 'center' };
    case 'paragraph':
      return { fontSize: '1rem', textAlign: 'left' };
    case 'button':
      return { buttonText: 'Learn More', buttonUrl: '#', buttonColor: '#2563eb', buttonVariant: 'solid', textAlign: 'center' };
    case 'image':
      return { imageUrl: '', imageAlt: 'Image', imageWidth: '100%' };
    case 'divider':
      return { padding: '1rem' };
    case 'spacer':
      return { spacerHeight: '2rem' };
    case 'stats-row':
      return {
        stats: [
          { label: 'Total Raised', value: '{{total_raised_formatted}}', icon: 'dollar' },
          { label: 'Campaigns', value: '{{campaign_count}}', icon: 'target' },
          { label: 'Supporters', value: '{{supporter_count}}', icon: 'users' },
        ],
        backgroundColor: '#f8fafc',
        padding: '2rem',
      };
    case 'cta-box':
      return {
        ctaTitle: 'Ready to Support?',
        ctaDescription: 'Join our community of supporters today.',
        ctaButtonText: 'Donate Now',
        ctaButtonUrl: '#campaigns',
        backgroundColor: '#eff6ff',
        padding: '2rem',
      };
    case 'testimonial':
      return {
        testimonialQuote: 'This program has made a real difference in our community.',
        testimonialAuthor: 'Parent Name',
        testimonialRole: 'Parent',
        backgroundColor: '#ffffff',
        padding: '2rem',
      };
    case 'campaign-list':
      return { campaignListTitle: 'Active Campaigns', campaignListLimit: 6 };
    case 'contact-info':
      return { showAddress: true, showPhone: true, showEmail: true, showWebsite: true, backgroundColor: '#f8fafc', padding: '2rem' };
    case 'two-column':
      return { columnRatio: '50-50', leftColumnContent: [], rightColumnContent: [], padding: '2rem' };
    case 'feature-grid':
      return {
        features: [
          { icon: 'dollar', title: 'Feature 1', description: 'Description of this feature' },
          { icon: 'users', title: 'Feature 2', description: 'Description of this feature' },
          { icon: 'bar-chart', title: 'Feature 3', description: 'Description of this feature' },
          { icon: 'shield', title: 'Feature 4', description: 'Description of this feature' },
        ],
        featureColumns: 2,
        backgroundColor: '#ffffff',
      };
    case 'how-it-works':
      return {
        steps: [
          { stepNumber: 1, title: 'Step 1', description: 'First step description' },
          { stepNumber: 2, title: 'Step 2', description: 'Second step description' },
          { stepNumber: 3, title: 'Step 3', description: 'Third step description' },
        ],
        backgroundColor: '#f8fafc',
      };
    case 'pricing-highlight':
      return {
        pricingTitle: '100% of Donations',
        pricingSubtitle: 'Go directly to your cause',
        pricingHighlight: '100%',
        pricingDescription: 'No hidden fees, no platform cuts.',
        backgroundColor: '#f0fdf4',
        textColor: '#166534',
      };
    default:
      return {};
  }
}
