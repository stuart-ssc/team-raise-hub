import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Copy, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LandingPageBlock as LandingPageBlockType } from "./types";

interface LandingPageBlockProps {
  block: LandingPageBlockType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (block: LandingPageBlockType) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function LandingPageBlock({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
}: LandingPageBlockProps) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderBlockPreview = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div 
            className="rounded-lg p-8 text-center min-h-[120px] flex flex-col justify-center"
            style={{ 
              backgroundColor: block.styles.heroBackgroundColor || '#1e40af',
              color: '#ffffff'
            }}
          >
            <h2 className="text-xl font-bold">{block.styles.heroTitle || 'Hero Title'}</h2>
            <p className="text-sm opacity-80">{block.styles.heroSubtitle || 'Subtitle text'}</p>
          </div>
        );

      case 'heading':
        return (
          <h3 
            className="font-semibold"
            style={{
              fontSize: block.styles.fontSize || '24px',
              color: block.styles.textColor || '#1e293b',
              textAlign: block.styles.textAlign || 'left',
            }}
          >
            {block.content || 'Heading Text'}
          </h3>
        );

      case 'paragraph':
        return (
          <p
            style={{
              fontSize: block.styles.fontSize || '16px',
              color: block.styles.textColor || '#64748b',
              textAlign: block.styles.textAlign || 'left',
            }}
          >
            {block.content || 'Paragraph text content...'}
          </p>
        );

      case 'button':
        return (
          <div style={{ textAlign: block.styles.textAlign || 'center' }}>
            <span
              className="inline-block px-6 py-2 rounded-md text-white font-medium"
              style={{ backgroundColor: block.styles.buttonColor || '#6366f1' }}
            >
              {block.styles.buttonText || 'Button'}
            </span>
          </div>
        );

      case 'stats-row':
        const stats = block.styles.stats || [
          { label: 'Stat 1', value: '100' },
          { label: 'Stat 2', value: '200' },
          { label: 'Stat 3', value: '300' },
        ];
        return (
          <div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg"
            style={{ backgroundColor: block.styles.backgroundColor || '#f8fafc' }}
          >
            {stats.slice(0, 4).map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        );

      case 'cta-box':
        return (
          <div 
            className="rounded-lg p-6 text-center"
            style={{ 
              backgroundColor: block.styles.backgroundColor || '#1e40af',
              color: block.styles.textColor || '#ffffff'
            }}
          >
            <h4 className="text-lg font-bold">{block.styles.ctaTitle || 'Call to Action'}</h4>
            <p className="text-sm opacity-80 mb-3">{block.styles.ctaDescription || 'Description text'}</p>
            <span className="inline-block px-4 py-2 bg-white text-gray-900 rounded-md text-sm font-medium">
              {block.styles.ctaButtonText || 'Learn More'}
            </span>
          </div>
        );

      case 'testimonial':
        return (
          <div 
            className="rounded-lg p-6"
            style={{ backgroundColor: block.styles.backgroundColor || '#f8fafc' }}
          >
            <blockquote className="italic text-muted-foreground mb-3">
              "{block.styles.testimonialQuote || 'Testimonial quote...'}"
            </blockquote>
            <p className="font-medium">{block.styles.testimonialAuthor || 'Author Name'}</p>
            <p className="text-sm text-muted-foreground">{block.styles.testimonialRole || 'Role'}</p>
          </div>
        );

      case 'campaign-list':
        return (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">{block.styles.campaignListTitle || 'Campaigns'}</h4>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Shows up to {block.styles.campaignListLimit || 6} campaigns
            </p>
          </div>
        );

      case 'contact-info':
        return (
          <div className="p-4 bg-muted/50 rounded-lg" style={{ textAlign: block.styles.textAlign || 'center' }}>
            <p className="text-sm text-muted-foreground">Contact Information Block</p>
            <div className="flex flex-wrap gap-2 justify-center mt-2 text-xs">
              {block.styles.showAddress && <span className="bg-muted px-2 py-1 rounded">Address</span>}
              {block.styles.showPhone && <span className="bg-muted px-2 py-1 rounded">Phone</span>}
              {block.styles.showEmail && <span className="bg-muted px-2 py-1 rounded">Email</span>}
              {block.styles.showWebsite && <span className="bg-muted px-2 py-1 rounded">Website</span>}
            </div>
          </div>
        );

      case 'divider':
        return <hr className="border-border" />;

      case 'spacer':
        return (
          <div 
            className="bg-muted/30 border border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-xs text-muted-foreground"
            style={{ height: block.styles.spacerHeight || '40px' }}
          >
            Spacer ({block.styles.spacerHeight || '40px'})
          </div>
        );

      case 'image':
        return block.styles.imageUrl ? (
          <img 
            src={block.styles.imageUrl} 
            alt={block.styles.imageAlt || ''} 
            className="rounded-lg max-w-full"
            style={{ width: block.styles.imageWidth || '100%' }}
          />
        ) : (
          <div className="h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            Image placeholder
          </div>
        );

      case 'feature-grid':
        const features = block.styles.features || [
          { icon: 'dollar', title: 'Feature 1', description: 'Description' },
          { icon: 'users', title: 'Feature 2', description: 'Description' },
        ];
        const cols = block.styles.featureColumns || 2;
        return (
          <div 
            className={`grid gap-4 p-4 rounded-lg ${cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}
            style={{ backgroundColor: block.styles.backgroundColor || '#ffffff' }}
          >
            {features.map((feature, i) => (
              <div key={i} className="text-center p-4 border rounded-lg bg-background">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="text-lg">●</span>
                </div>
                <h4 className="font-semibold mb-1">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        );

      case 'how-it-works':
        const steps = block.styles.steps || [
          { stepNumber: 1, title: 'Step 1', description: 'Description' },
          { stepNumber: 2, title: 'Step 2', description: 'Description' },
          { stepNumber: 3, title: 'Step 3', description: 'Description' },
        ];
        return (
          <div 
            className="p-6 rounded-lg"
            style={{ backgroundColor: block.styles.backgroundColor || '#f8fafc' }}
          >
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              {steps.map((step, i) => (
                <div key={i} className="flex-1 text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    {step.stepNumber}
                  </div>
                  <h4 className="font-semibold mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'pricing-highlight':
        return (
          <div 
            className="p-8 rounded-lg text-center"
            style={{ 
              backgroundColor: block.styles.backgroundColor || '#f0fdf4',
              color: block.styles.textColor || '#166534'
            }}
          >
            <p className="text-sm font-medium opacity-80 mb-2">{block.styles.pricingSubtitle || 'Subtitle'}</p>
            <div className="text-6xl font-bold mb-2">{block.styles.pricingHighlight || '100%'}</div>
            <h3 className="text-2xl font-bold mb-3">{block.styles.pricingTitle || 'Title'}</h3>
            <p className="text-sm opacity-80 max-w-md mx-auto">{block.styles.pricingDescription || 'Description'}</p>
          </div>
        );

      default:
        return <div className="p-4 bg-muted rounded">Unknown block type: {block.type}</div>;
    }
  };

  const renderEditor = () => {
    const updateStyles = (updates: Partial<typeof block.styles>) => {
      onUpdate({ ...block, styles: { ...block.styles, ...updates } });
    };

    switch (block.type) {
      case 'hero':
        return (
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={block.styles.heroTitle || ''}
                onChange={(e) => updateStyles({ heroTitle: e.target.value })}
                placeholder="Hero title (supports {{variables}})"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={block.styles.heroSubtitle || ''}
                onChange={(e) => updateStyles({ heroSubtitle: e.target.value })}
                placeholder="Subtitle text"
              />
            </div>
            <div>
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={block.styles.heroBackgroundColor || '#1e40af'}
                  onChange={(e) => updateStyles({ heroBackgroundColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={block.styles.heroBackgroundColor || '#1e40af'}
                  onChange={(e) => updateStyles({ heroBackgroundColor: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Height</Label>
              <Input
                value={block.styles.heroHeight || '400px'}
                onChange={(e) => updateStyles({ heroHeight: e.target.value })}
                placeholder="e.g., 400px"
              />
            </div>
          </div>
        );

      case 'heading':
      case 'paragraph':
        return (
          <div className="space-y-3">
            <div>
              <Label>Content</Label>
              {block.type === 'paragraph' ? (
                <Textarea
                  value={block.content}
                  onChange={(e) => onUpdate({ ...block, content: e.target.value })}
                  placeholder="Enter text content (supports {{variables}})"
                  rows={3}
                />
              ) : (
                <Input
                  value={block.content}
                  onChange={(e) => onUpdate({ ...block, content: e.target.value })}
                  placeholder="Enter heading text"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Font Size</Label>
                <Input
                  value={block.styles.fontSize || (block.type === 'heading' ? '24px' : '16px')}
                  onChange={(e) => updateStyles({ fontSize: e.target.value })}
                  placeholder="e.g., 24px"
                />
              </div>
              <div>
                <Label>Text Align</Label>
                <Select
                  value={block.styles.textAlign || 'left'}
                  onValueChange={(v) => updateStyles({ textAlign: v as 'left' | 'center' | 'right' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={block.styles.textColor || '#1e293b'}
                  onChange={(e) => updateStyles({ textColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={block.styles.textColor || '#1e293b'}
                  onChange={(e) => updateStyles({ textColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-3">
            <div>
              <Label>Button Text</Label>
              <Input
                value={block.styles.buttonText || ''}
                onChange={(e) => updateStyles({ buttonText: e.target.value })}
                placeholder="Button label"
              />
            </div>
            <div>
              <Label>Button URL</Label>
              <Input
                value={block.styles.buttonUrl || ''}
                onChange={(e) => updateStyles({ buttonUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Button Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={block.styles.buttonColor || '#6366f1'}
                  onChange={(e) => updateStyles({ buttonColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={block.styles.buttonColor || '#6366f1'}
                  onChange={(e) => updateStyles({ buttonColor: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Alignment</Label>
              <Select
                value={block.styles.textAlign || 'center'}
                onValueChange={(v) => updateStyles({ textAlign: v as 'left' | 'center' | 'right' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'cta-box':
        return (
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={block.styles.ctaTitle || ''}
                onChange={(e) => updateStyles({ ctaTitle: e.target.value })}
                placeholder="CTA title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={block.styles.ctaDescription || ''}
                onChange={(e) => updateStyles({ ctaDescription: e.target.value })}
                placeholder="CTA description"
                rows={2}
              />
            </div>
            <div>
              <Label>Button Text</Label>
              <Input
                value={block.styles.ctaButtonText || ''}
                onChange={(e) => updateStyles({ ctaButtonText: e.target.value })}
                placeholder="Button label"
              />
            </div>
            <div>
              <Label>Button URL</Label>
              <Input
                value={block.styles.ctaButtonUrl || ''}
                onChange={(e) => updateStyles({ ctaButtonUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={block.styles.backgroundColor || '#1e40af'}
                  onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={block.styles.backgroundColor || '#1e40af'}
                  onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'testimonial':
        return (
          <div className="space-y-3">
            <div>
              <Label>Quote</Label>
              <Textarea
                value={block.styles.testimonialQuote || ''}
                onChange={(e) => updateStyles({ testimonialQuote: e.target.value })}
                placeholder="Testimonial quote"
                rows={3}
              />
            </div>
            <div>
              <Label>Author Name</Label>
              <Input
                value={block.styles.testimonialAuthor || ''}
                onChange={(e) => updateStyles({ testimonialAuthor: e.target.value })}
                placeholder="Author name"
              />
            </div>
            <div>
              <Label>Author Role</Label>
              <Input
                value={block.styles.testimonialRole || ''}
                onChange={(e) => updateStyles({ testimonialRole: e.target.value })}
                placeholder="e.g., Parent, Supporter"
              />
            </div>
          </div>
        );

      case 'campaign-list':
        return (
          <div className="space-y-3">
            <div>
              <Label>Section Title</Label>
              <Input
                value={block.styles.campaignListTitle || ''}
                onChange={(e) => updateStyles({ campaignListTitle: e.target.value })}
                placeholder="e.g., Active Campaigns"
              />
            </div>
            <div>
              <Label>Max Campaigns to Show</Label>
              <Input
                type="number"
                value={block.styles.campaignListLimit || 6}
                onChange={(e) => updateStyles({ campaignListLimit: parseInt(e.target.value) || 6 })}
                min={1}
                max={12}
              />
            </div>
          </div>
        );

      case 'contact-info':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Show Address</Label>
              <Switch
                checked={block.styles.showAddress ?? true}
                onCheckedChange={(v) => updateStyles({ showAddress: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Phone</Label>
              <Switch
                checked={block.styles.showPhone ?? true}
                onCheckedChange={(v) => updateStyles({ showPhone: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Email</Label>
              <Switch
                checked={block.styles.showEmail ?? true}
                onCheckedChange={(v) => updateStyles({ showEmail: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Website</Label>
              <Switch
                checked={block.styles.showWebsite ?? true}
                onCheckedChange={(v) => updateStyles({ showWebsite: v })}
              />
            </div>
            <div>
              <Label>Alignment</Label>
              <Select
                value={block.styles.textAlign || 'center'}
                onValueChange={(v) => updateStyles({ textAlign: v as 'left' | 'center' | 'right' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'spacer':
        return (
          <div>
            <Label>Height</Label>
            <Input
              value={block.styles.spacerHeight || '40px'}
              onChange={(e) => updateStyles({ spacerHeight: e.target.value })}
              placeholder="e.g., 40px"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            <div>
              <Label>Image URL</Label>
              <Input
                value={block.styles.imageUrl || ''}
                onChange={(e) => updateStyles({ imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Alt Text</Label>
              <Input
                value={block.styles.imageAlt || ''}
                onChange={(e) => updateStyles({ imageAlt: e.target.value })}
                placeholder="Image description"
              />
            </div>
            <div>
              <Label>Width</Label>
              <Input
                value={block.styles.imageWidth || '100%'}
                onChange={(e) => updateStyles({ imageWidth: e.target.value })}
                placeholder="e.g., 100%, 500px"
              />
            </div>
          </div>
        );

      case 'feature-grid':
        return (
          <div className="space-y-3">
            <div>
              <Label>Number of Columns</Label>
              <Select
                value={String(block.styles.featureColumns || 2)}
                onValueChange={(v) => updateStyles({ featureColumns: parseInt(v) as 2 | 3 | 4 })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={block.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={block.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Edit individual features in the template data</p>
          </div>
        );

      case 'how-it-works':
        return (
          <div className="space-y-3">
            <div>
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={block.styles.backgroundColor || '#f8fafc'}
                  onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={block.styles.backgroundColor || '#f8fafc'}
                  onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Edit steps in the template data</p>
          </div>
        );

      case 'pricing-highlight':
        return (
          <div className="space-y-3">
            <div>
              <Label>Highlight Text (Large)</Label>
              <Input
                value={block.styles.pricingHighlight || ''}
                onChange={(e) => updateStyles({ pricingHighlight: e.target.value })}
                placeholder="e.g., 100%, $0, FREE"
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={block.styles.pricingTitle || ''}
                onChange={(e) => updateStyles({ pricingTitle: e.target.value })}
                placeholder="Main message"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={block.styles.pricingSubtitle || ''}
                onChange={(e) => updateStyles({ pricingSubtitle: e.target.value })}
                placeholder="Secondary message"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={block.styles.pricingDescription || ''}
                onChange={(e) => updateStyles({ pricingDescription: e.target.value })}
                placeholder="Supporting text"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={block.styles.backgroundColor || '#f0fdf4'}
                    onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={block.styles.backgroundColor || '#f0fdf4'}
                    onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={block.styles.textColor || '#166534'}
                    onChange={(e) => updateStyles({ textColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={block.styles.textColor || '#166534'}
                    onChange={(e) => updateStyles({ textColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">No editable options for this block type.</p>;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`relative group ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onSelect}
    >
      <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing ? (
          <>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(false)}>
              <Check className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(false)}>
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      <div className="p-4 pl-10">
        {isEditing ? renderEditor() : renderBlockPreview()}
      </div>
    </Card>
  );
}
