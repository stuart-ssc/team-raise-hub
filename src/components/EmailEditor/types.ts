export type BlockType = 'heading' | 'paragraph' | 'button' | 'image' | 'divider' | 'spacer';

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: string;
  styles: {
    fontSize?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: string;
    backgroundColor?: string;
    padding?: string;
    buttonColor?: string;
    buttonText?: string;
    buttonUrl?: string;
    imageUrl?: string;
    imageAlt?: string;
    imageWidth?: string;
    spacerHeight?: string;
  };
}

export interface EmailEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSubject?: string;
  initialContent?: string;
  onSave: (subject: string, htmlContent: string) => void;
}
