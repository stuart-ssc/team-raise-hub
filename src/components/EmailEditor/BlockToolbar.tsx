import { Type, AlignLeft, Link, Image, Minus, Space } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BlockToolbarProps {
  onAddBlock: (type: string) => void;
}

export function BlockToolbar({ onAddBlock }: BlockToolbarProps) {
  const blocks = [
    { type: 'heading', icon: Type, label: 'Heading' },
    { type: 'paragraph', icon: AlignLeft, label: 'Paragraph' },
    { type: 'button', icon: Link, label: 'Button' },
    { type: 'image', icon: Image, label: 'Image' },
    { type: 'divider', icon: Minus, label: 'Divider' },
    { type: 'spacer', icon: Space, label: 'Spacer' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Add Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {blocks.map((block) => {
          const Icon = block.icon;
          return (
            <Button
              key={block.type}
              variant="outline"
              className="w-full justify-start"
              onClick={() => onAddBlock(block.type)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {block.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
