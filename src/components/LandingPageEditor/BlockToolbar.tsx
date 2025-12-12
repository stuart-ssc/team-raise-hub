import { 
  Type, 
  AlignLeft, 
  Link, 
  Image, 
  Minus, 
  Space,
  LayoutTemplate,
  BarChart3,
  Megaphone,
  Quote,
  List,
  MapPin,
  Columns
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LandingPageBlockType } from "./types";

interface BlockToolbarProps {
  onAddBlock: (type: LandingPageBlockType) => void;
}

export function BlockToolbar({ onAddBlock }: BlockToolbarProps) {
  const blocks: { type: LandingPageBlockType; icon: typeof Type; label: string; description: string }[] = [
    { type: 'hero', icon: LayoutTemplate, label: 'Hero Section', description: 'Full-width hero with background' },
    { type: 'heading', icon: Type, label: 'Heading', description: 'Title or section header' },
    { type: 'paragraph', icon: AlignLeft, label: 'Paragraph', description: 'Text content block' },
    { type: 'button', icon: Link, label: 'Button', description: 'Call-to-action button' },
    { type: 'image', icon: Image, label: 'Image', description: 'Single image display' },
    { type: 'stats-row', icon: BarChart3, label: 'Stats Row', description: 'Horizontal statistics cards' },
    { type: 'cta-box', icon: Megaphone, label: 'CTA Box', description: 'Call-to-action section' },
    { type: 'testimonial', icon: Quote, label: 'Testimonial', description: 'Quote with attribution' },
    { type: 'campaign-list', icon: List, label: 'Campaign List', description: 'Auto-populated campaigns' },
    { type: 'contact-info', icon: MapPin, label: 'Contact Info', description: 'Address, phone, email' },
    { type: 'two-column', icon: Columns, label: 'Two Columns', description: 'Side-by-side layout' },
    { type: 'divider', icon: Minus, label: 'Divider', description: 'Horizontal line separator' },
    { type: 'spacer', icon: Space, label: 'Spacer', description: 'Vertical space' },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Add Components</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4">
          <div className="space-y-1 pb-4">
            {blocks.map((block) => {
              const Icon = block.icon;
              return (
                <Button
                  key={block.type}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-3"
                  onClick={() => onAddBlock(block.type)}
                >
                  <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{block.label}</p>
                    <p className="text-xs text-muted-foreground">{block.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
