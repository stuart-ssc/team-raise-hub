import { FileText, Image, Download, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
  isOwn?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  return File;
};

const isImageType = (type: string) => type.startsWith('image/');

export function MessageAttachments({ attachments, isOwn = false }: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter(a => isImageType(a.type));
  const files = attachments.filter(a => !isImageType(a.type));

  return (
    <div className="space-y-2 mt-2">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {images.map((image, idx) => (
            <a
              key={idx}
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-auto max-h-48 object-cover"
              />
            </a>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, idx) => {
            const Icon = getFileIcon(file.type);
            return (
              <a
                key={idx}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                download={file.name}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isOwn 
                    ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20' 
                    : 'bg-background/50 hover:bg-background/80'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs opacity-70">{formatFileSize(file.size)}</p>
                </div>
                <Download className="h-4 w-4 shrink-0 opacity-70" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
