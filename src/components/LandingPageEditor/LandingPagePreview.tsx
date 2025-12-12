import React from 'react';
import { Monitor, Tablet, Smartphone, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LandingPageBlock as LandingPageBlockType, TemplateVariables } from './types';
import { resolveTemplateVariables } from './resolveTemplateVariables';

interface LandingPagePreviewProps {
  blocks: LandingPageBlockType[];
  variables: Partial<TemplateVariables>;
  previewUrl?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const deviceWidths: Record<DeviceType, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

export function LandingPagePreview({ blocks, variables, previewUrl }: LandingPagePreviewProps) {
  const [device, setDevice] = React.useState<DeviceType>('desktop');
  
  const resolvedBlocks = React.useMemo(
    () => resolveTemplateVariables(blocks, variables),
    [blocks, variables]
  );
  
  const containerWidth = deviceWidths[device];
  const scale = Math.min(1, 600 / containerWidth);
  
  const handleOpenFullPreview = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-muted/30 rounded-lg border">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-background rounded-t-lg">
        <ToggleGroup
          type="single"
          value={device}
          onValueChange={(value) => value && setDevice(value as DeviceType)}
          className="gap-1"
        >
          <ToggleGroupItem value="desktop" aria-label="Desktop view" size="sm">
            <Monitor className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="tablet" aria-label="Tablet view" size="sm">
            <Tablet className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="mobile" aria-label="Mobile view" size="sm">
            <Smartphone className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        {previewUrl && (
          <Button variant="outline" size="sm" onClick={handleOpenFullPreview}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Full Preview
          </Button>
        )}
      </div>
      
      {/* Preview content */}
      <ScrollArea className="flex-1">
        <div className="p-4 flex justify-center">
          <div
            className="bg-background rounded-lg shadow-lg overflow-hidden transition-all duration-300"
            style={{
              width: containerWidth,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            {resolvedBlocks.length > 0 ? (
              <div className="min-h-[400px]">
                {resolvedBlocks.map((block) => (
                  <PreviewBlock key={block.id} block={block} />
                ))}
              </div>
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-muted-foreground">
                <p>Select a template to see preview</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Simple block renderer for preview - using any type to avoid strict type checking
function PreviewBlock({ block }: { block: LandingPageBlockType }) {
  const styles = (block.styles || {}) as Record<string, any>;
  
  switch (block.type) {
    case 'hero':
      return (
        <div
          className="relative py-20 px-8 text-center"
          style={{
            backgroundColor: styles.heroBackgroundColor || styles.backgroundColor || 'hsl(var(--primary))',
            backgroundImage: styles.heroBackgroundImage ? `url(${styles.heroBackgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {styles.heroOverlay && (
            <div className="absolute inset-0 bg-black/50" />
          )}
          <div className="relative z-10">
            <h1
              className="text-4xl font-bold mb-4"
              style={{ color: styles.textColor || 'white' }}
            >
              {block.content || styles.heroTitle || 'Hero Title'}
            </h1>
            {styles.heroSubtitle && (
              <p
                className="text-xl mb-6"
                style={{ color: styles.textColor || 'white', opacity: 0.9 }}
              >
                {styles.heroSubtitle}
              </p>
            )}
            {styles.buttonText && (
              <button
                className="px-6 py-3 rounded-lg font-semibold"
                style={{
                  backgroundColor: styles.buttonColor || 'white',
                  color: styles.textColor || 'hsl(var(--primary))',
                }}
              >
                {styles.buttonText}
              </button>
            )}
          </div>
        </div>
      );
      
    case 'heading':
      const headingLevel = styles.headingLevel || 'h2';
      const HeadingTag = headingLevel as keyof JSX.IntrinsicElements;
      const headingSizes: Record<string, string> = {
        h1: 'text-4xl',
        h2: 'text-3xl',
        h3: 'text-2xl',
        h4: 'text-xl',
      };
      return (
        <HeadingTag
          className={`${headingSizes[headingLevel] || 'text-2xl'} font-bold px-8 py-4`}
          style={{
            textAlign: styles.textAlign || 'left',
            color: styles.textColor,
          }}
        >
          {block.content || 'Heading'}
        </HeadingTag>
      );
      
    case 'paragraph':
      return (
        <p
          className="px-8 py-2 leading-relaxed"
          style={{
            textAlign: styles.textAlign || 'left',
            fontSize: styles.fontSize || '16px',
            color: styles.textColor,
          }}
        >
          {block.content || 'Paragraph text'}
        </p>
      );
      
    case 'image':
      return (
        <div className="px-8 py-4" style={{ textAlign: styles.textAlign || 'center' }}>
          {block.content ? (
            <img
              src={block.content}
              alt={styles.imageAlt || ''}
              className="max-w-full h-auto rounded-lg"
              style={{
                width: styles.imageWidth || 'auto',
                height: styles.imageHeight || 'auto',
              }}
            />
          ) : (
            <div className="bg-muted h-48 rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Image placeholder</span>
            </div>
          )}
        </div>
      );
      
    case 'button':
      return (
        <div className="px-8 py-4" style={{ textAlign: styles.textAlign || 'center' }}>
          <button
            className="px-6 py-3 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: styles.buttonColor || styles.backgroundColor || 'hsl(var(--primary))',
              color: styles.textColor || 'white',
            }}
          >
            {block.content || 'Button'}
          </button>
        </div>
      );
      
    case 'divider':
      return (
        <div className="px-8 py-4">
          <hr
            style={{
              borderColor: styles.dividerColor || 'hsl(var(--border))',
            }}
          />
        </div>
      );
      
    case 'spacer':
      return <div style={{ height: styles.spacerHeight || '40px' }} />;
      
    case 'two-column':
      return (
        <div
          className="grid grid-cols-2 gap-4 px-8 py-4"
          style={{ backgroundColor: styles.backgroundColor }}
        >
          <div className="p-4 bg-muted/50 rounded">
            <p className="text-muted-foreground">{styles.leftColumnContent || 'Left column content'}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded">
            <p className="text-muted-foreground">{styles.rightColumnContent || 'Right column content'}</p>
          </div>
        </div>
      );
      
    default:
      return (
        <div className="px-8 py-4 bg-muted/50 text-muted-foreground text-sm">
          Block: {block.type}
        </div>
      );
  }
}
