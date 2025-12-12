import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText, Copy, Sparkles } from 'lucide-react';
import { LandingPageBlock } from './types';
import { landingPageLayouts } from './LandingPageTemplates';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTemplate: (data: {
    name: string;
    templateType: 'school' | 'district' | 'nonprofit';
    blocks: LandingPageBlock[];
    sourceType: 'blank' | 'preset' | 'duplicate';
  }) => void;
  existingTemplates?: Array<{ id: string; name: string; blocks: LandingPageBlock[] }>;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onCreateTemplate,
  existingTemplates = [],
}: CreateTemplateDialogProps) {
  const [name, setName] = useState('');
  const [templateType, setTemplateType] = useState<'school' | 'district' | 'nonprofit'>('school');
  const [sourceType, setSourceType] = useState<'blank' | 'preset' | 'duplicate'>('preset');
  const [selectedPreset, setSelectedPreset] = useState('modern-school');
  const [selectedDuplicate, setSelectedDuplicate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      let blocks: LandingPageBlock[] = [];

      if (sourceType === 'preset') {
        const preset = landingPageLayouts.find(t => t.id === selectedPreset);
        blocks = preset ? [...preset.blocks] : [];
      } else if (sourceType === 'duplicate' && selectedDuplicate) {
        const source = existingTemplates.find(t => t.id === selectedDuplicate);
        blocks = source ? JSON.parse(JSON.stringify(source.blocks)) : [];
      }

      onCreateTemplate({
        name: name.trim(),
        templateType,
        blocks,
        sourceType,
      });

      // Reset form
      setName('');
      setSourceType('preset');
      setSelectedPreset('modern-school');
      setSelectedDuplicate('');
    } finally {
      setIsCreating(false);
    }
  };

  const presets = landingPageLayouts.filter(t => 
    t.templateType === templateType || 
    t.id === 'school-modern'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Start with a preset or create from scratch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name..."
            />
          </div>

          <div className="space-y-2">
            <Label>Template Type</Label>
            <Select value={templateType} onValueChange={(v: 'school' | 'district' | 'nonprofit') => setTemplateType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="district">District</SelectItem>
                <SelectItem value="nonprofit">Non-Profit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Starting Point</Label>
            <RadioGroup value={sourceType} onValueChange={(v: 'blank' | 'preset' | 'duplicate') => setSourceType(v)}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="preset" id="preset" />
                <Label htmlFor="preset" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Use Preset Template</p>
                    <p className="text-sm text-muted-foreground">Start with a professionally designed template</p>
                  </div>
                </Label>
              </div>
              
              {existingTemplates.length > 0 && (
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="duplicate" id="duplicate" />
                  <Label htmlFor="duplicate" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Copy className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">Duplicate Existing</p>
                      <p className="text-sm text-muted-foreground">Copy and customize an existing template</p>
                    </div>
                  </Label>
                </div>
              )}

              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="blank" id="blank" />
                <Label htmlFor="blank" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Start Blank</p>
                    <p className="text-sm text-muted-foreground">Build your template from scratch</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {sourceType === 'preset' && (
            <div className="space-y-2">
              <Label>Select Preset</Label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presets.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sourceType === 'duplicate' && existingTemplates.length > 0 && (
            <div className="space-y-2">
              <Label>Select Template to Duplicate</Label>
              <Select value={selectedDuplicate} onValueChange={setSelectedDuplicate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {existingTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!name.trim() || isCreating || (sourceType === 'duplicate' && !selectedDuplicate)}
          >
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
