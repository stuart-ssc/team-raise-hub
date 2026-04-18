import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, ImageIcon, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadPromptProps {
  campaignId: string;
  disabled?: boolean;
  onUploaded: (url: string) => void;
  onSkip: () => void;
  onDismiss: () => void;
  pathPrefix?: string;
  label?: string;
}

export default function ImageUploadPrompt({
  campaignId,
  disabled,
  onUploaded,
  onSkip,
  onDismiss,
  pathPrefix,
  label = "Upload campaign image",
}: ImageUploadPromptProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 10MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const prefix = pathPrefix || "cover";
      const path = `${campaignId}/${prefix}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("campaign-item-images")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from("campaign-item-images")
        .getPublicUrl(path);

      setUploadedUrl(publicUrl);
      onUploaded(publicUrl);
    } catch (e: any) {
      console.error("Image upload failed:", e);
      toast({
        title: "Upload failed",
        description: e.message || "Could not upload image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  if (uploadedUrl) {
    return (
      <div className="w-full rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b bg-muted/40 flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium">Image uploaded</span>
        </div>
        <div className="p-3">
          <img
            src={uploadedUrl}
            alt="Campaign"
            className="w-full h-32 object-cover rounded-md"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
      </div>

      <div
        className={cn(
          "m-3 rounded-md border-2 border-dashed transition-colors p-6 text-center",
          dragActive ? "border-primary bg-primary/5" : "border-border bg-muted/30",
          disabled && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-primary hover:underline"
              disabled={disabled}
            >
              Click to upload
            </button>
            <span className="text-xs text-muted-foreground">or drag and drop · PNG, JPG up to 10MB</span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      <div className="px-3 py-2 border-t bg-muted/30 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Or skip and add one later</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onSkip} disabled={uploading || disabled}>
          Skip image
        </Button>
      </div>
    </div>
  );
}
