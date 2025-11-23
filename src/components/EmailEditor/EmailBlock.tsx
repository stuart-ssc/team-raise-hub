import { useState } from "react";
import { GripVertical, Trash2, Edit2, Copy } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { EmailBlock as EmailBlockType } from "./types";

interface EmailBlockProps {
  block: EmailBlockType;
  onUpdate: (id: string, updates: Partial<EmailBlockType>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUploadImage: (blockId: string, file: File) => Promise<void>;
}

export function EmailBlock({ block, onUpdate, onDelete, onDuplicate, onUploadImage }: EmailBlockProps) {
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

  const renderBlock = () => {
    const { type, content, styles } = block;

    switch (type) {
      case 'heading':
        return (
          <h2 
            style={{ 
              fontSize: styles.fontSize || '24px',
              color: styles.color || '#000000',
              textAlign: styles.textAlign || 'left',
              fontWeight: styles.fontWeight || 'bold',
              margin: 0,
            }}
          >
            {content || 'Heading Text'}
          </h2>
        );
      case 'paragraph':
        return (
          <p 
            style={{ 
              fontSize: styles.fontSize || '16px',
              color: styles.color || '#000000',
              textAlign: styles.textAlign || 'left',
              margin: 0,
            }}
          >
            {content || 'Paragraph text goes here'}
          </p>
        );
      case 'button':
        return (
          <div style={{ textAlign: styles.textAlign || 'center' }}>
            <a
              href={styles.buttonUrl || '#'}
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: styles.buttonColor || '#0066cc',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              {styles.buttonText || 'Click Here'}
            </a>
          </div>
        );
      case 'image':
        return (
          <div style={{ textAlign: styles.textAlign || 'center' }}>
            {styles.imageUrl ? (
              <img 
                src={styles.imageUrl} 
                alt={styles.imageAlt || 'Email image'} 
                style={{ 
                  maxWidth: styles.imageWidth || '100%',
                  height: 'auto',
                }}
              />
            ) : (
              <div className="bg-muted p-8 text-center text-muted-foreground">
                No image uploaded
              </div>
            )}
          </div>
        );
      case 'divider':
        return (
          <hr style={{ 
            border: 'none',
            borderTop: '1px solid #dddddd',
            margin: '20px 0',
          }} />
        );
      case 'spacer':
        return (
          <div style={{ height: styles.spacerHeight || '20px' }} />
        );
      default:
        return null;
    }
  };

  const renderEditor = () => {
    const { type, content, styles } = block;

    switch (type) {
      case 'heading':
      case 'paragraph':
        return (
          <div className="space-y-3">
            <div>
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Size</Label>
                <Select
                  value={styles.fontSize || (type === 'heading' ? '24px' : '16px')}
                  onValueChange={(value) => onUpdate(block.id, { styles: { ...styles, fontSize: value } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14px">14px</SelectItem>
                    <SelectItem value="16px">16px</SelectItem>
                    <SelectItem value="18px">18px</SelectItem>
                    <SelectItem value="20px">20px</SelectItem>
                    <SelectItem value="24px">24px</SelectItem>
                    <SelectItem value="32px">32px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={styles.color || '#000000'}
                  onChange={(e) => onUpdate(block.id, { styles: { ...styles, color: e.target.value } })}
                />
              </div>
              <div>
                <Label>Align</Label>
                <Select
                  value={styles.textAlign || 'left'}
                  onValueChange={(value: any) => onUpdate(block.id, { styles: { ...styles, textAlign: value } })}
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
          </div>
        );
      case 'button':
        return (
          <div className="space-y-3">
            <div>
              <Label>Button Text</Label>
              <Input
                value={styles.buttonText || ''}
                onChange={(e) => onUpdate(block.id, { styles: { ...styles, buttonText: e.target.value } })}
                placeholder="Click Here"
              />
            </div>
            <div>
              <Label>Button URL</Label>
              <Input
                value={styles.buttonUrl || ''}
                onChange={(e) => onUpdate(block.id, { styles: { ...styles, buttonUrl: e.target.value } })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={styles.buttonColor || '#0066cc'}
                  onChange={(e) => onUpdate(block.id, { styles: { ...styles, buttonColor: e.target.value } })}
                />
              </div>
              <div>
                <Label>Align</Label>
                <Select
                  value={styles.textAlign || 'center'}
                  onValueChange={(value: any) => onUpdate(block.id, { styles: { ...styles, textAlign: value } })}
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
          </div>
        );
      case 'image':
        return (
          <div className="space-y-3">
            <div>
              <Label>Upload Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await onUploadImage(block.id, file);
                  }
                }}
              />
            </div>
            <div>
              <Label>Alt Text</Label>
              <Input
                value={styles.imageAlt || ''}
                onChange={(e) => onUpdate(block.id, { styles: { ...styles, imageAlt: e.target.value } })}
                placeholder="Image description"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Width</Label>
                <Select
                  value={styles.imageWidth || '100%'}
                  onValueChange={(value) => onUpdate(block.id, { styles: { ...styles, imageWidth: value } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100%">Full Width</SelectItem>
                    <SelectItem value="75%">75%</SelectItem>
                    <SelectItem value="50%">50%</SelectItem>
                    <SelectItem value="300px">300px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Align</Label>
                <Select
                  value={styles.textAlign || 'center'}
                  onValueChange={(value: any) => onUpdate(block.id, { styles: { ...styles, textAlign: value } })}
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
          </div>
        );
      case 'spacer':
        return (
          <div>
            <Label>Height</Label>
            <Select
              value={styles.spacerHeight || '20px'}
              onValueChange={(value) => onUpdate(block.id, { styles: { ...styles, spacerHeight: value } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10px">Small (10px)</SelectItem>
                <SelectItem value="20px">Medium (20px)</SelectItem>
                <SelectItem value="40px">Large (40px)</SelectItem>
                <SelectItem value="60px">XL (60px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative group">
      <div 
        className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDuplicate(block.id)}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(block.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <div className="p-4 pt-10">
        {isEditing ? renderEditor() : renderBlock()}
      </div>
    </Card>
  );
}
