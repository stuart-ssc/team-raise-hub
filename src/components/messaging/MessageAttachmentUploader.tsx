import { useState, useRef, useCallback } from "react";
import { Paperclip, X, Image, FileText, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface PendingFile {
  file: File;
  preview?: string;
}

interface MessageAttachmentUploaderProps {
  conversationId: string;
  onAttachmentsChange: (attachments: Attachment[]) => void;
  pendingAttachments: Attachment[];
  disabled?: boolean;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function MessageAttachmentUploader({
  conversationId,
  onAttachmentsChange,
  pendingAttachments,
  disabled = false
}: MessageAttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const currentCount = pendingAttachments.length + pendingFiles.length;
    const remainingSlots = MAX_FILES - currentCount;
    
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_FILES} files allowed per message`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    
    // Validate file sizes
    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    
    try {
      const uploadedAttachments: Attachment[] = [];

      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${conversationId}/${crypto.randomUUID()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(data.path);

        uploadedAttachments.push({
          name: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size
        });
      }

      if (uploadedAttachments.length > 0) {
        onAttachmentsChange([...pendingAttachments, ...uploadedAttachments]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [conversationId, pendingAttachments, pendingFiles.length, onAttachmentsChange]);

  const removeAttachment = (index: number) => {
    const updated = [...pendingAttachments];
    updated.splice(index, 1);
    onAttachmentsChange(updated);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="space-y-2">
      {/* Attachment Previews */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
          {pendingAttachments.map((attachment, idx) => {
            const Icon = getFileIcon(attachment.type);
            const isImage = attachment.type.startsWith('image/');
            
            return (
              <div
                key={idx}
                className="relative group flex items-center gap-2 bg-background rounded-md px-2 py-1.5 border"
              >
                {isImage ? (
                  <img 
                    src={attachment.url} 
                    alt={attachment.name}
                    className="h-8 w-8 object-cover rounded"
                  />
                ) : (
                  <Icon className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="max-w-[120px]">
                  <p className="text-xs font-medium truncate">{attachment.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeAttachment(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Button */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || uploading}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || uploading || pendingAttachments.length >= MAX_FILES}
          onClick={() => fileInputRef.current?.click()}
          title={pendingAttachments.length >= MAX_FILES ? `Maximum ${MAX_FILES} files` : 'Attach files'}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
