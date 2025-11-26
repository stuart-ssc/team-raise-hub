import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LogoUploadProps {
  organizationId: string;
  currentLogoUrl?: string | null;
  onLogoUpdate: (url: string | null) => void;
}

export const LogoUpload = ({ organizationId, currentLogoUrl, onLogoUpdate }: LogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Delete old logo if exists
      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("organization-logos").remove([oldPath]);
      }

      // Upload new logo
      const fileExt = file.name.split(".").pop();
      const fileName = `${organizationId}/logo-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("organization-logos")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("organization-logos")
        .getPublicUrl(fileName);

      onLogoUpdate(publicUrl);
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentLogoUrl) return;

    setIsUploading(true);
    try {
      const oldPath = currentLogoUrl.split("/").slice(-2).join("/");
      const { error } = await supabase.storage
        .from("organization-logos")
        .remove([oldPath]);

      if (error) throw error;

      onLogoUpdate(null);
      
      toast({
        title: "Success",
        description: "Logo removed successfully",
      });
    } catch (error: any) {
      console.error("Error removing logo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {currentLogoUrl ? (
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-48 rounded-lg border-2 border-border overflow-hidden bg-muted">
            <img
              src={currentLogoUrl}
              alt="Organization logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Replace
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`relative h-32 w-full rounded-lg border-2 border-dashed transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border bg-muted hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-primary hover:underline"
                disabled={isUploading}
              >
                Click to upload
              </button>{" "}
              or drag and drop
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, SVG up to 5MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        disabled={isUploading}
      />
    </div>
  );
};