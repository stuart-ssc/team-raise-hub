import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  userId: string;
  onUploadComplete: (fileUrl: string, fileName: string) => void;
  maxSizeMB?: number;
  acceptedTypes?: string;
  label?: string;
  description?: string;
}

export const DocumentUpload = ({ 
  userId, 
  onUploadComplete,
  maxSizeMB = 10,
  acceptedTypes = ".pdf",
  label = "Upload Document",
  description = "Upload your verification document (PDF, max 10MB)"
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('pdf')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file.",
      });
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `File size must be less than ${maxSizeMB}MB.`,
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique file path with user ID and timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(filePath);

      setUploadedFile({ name: file.name, url: publicUrl });
      onUploadComplete(publicUrl, file.name);

      toast({
        title: "Success",
        description: "Document uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload document. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!uploadedFile) return;

    try {
      // Extract file path from URL
      const urlParts = uploadedFile.url.split('/verification-documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        const { error } = await supabase.storage
          .from('verification-documents')
          .remove([filePath]);

        if (error) throw error;
      }

      setUploadedFile(null);
      toast({
        title: "Success",
        description: "Document removed successfully.",
      });
    } catch (error: any) {
      console.error("Error removing document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove document.",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="document-upload">{label}</Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {uploadedFile ? (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm font-medium">{uploadedFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex items-center gap-3">
          <Input
            id="document-upload"
            type="file"
            accept={acceptedTypes}
            onChange={handleFileUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          {uploading && (
            <span className="text-sm text-muted-foreground">Uploading...</span>
          )}
        </div>
      )}

      <Alert variant="default" className="bg-muted/50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Your document will be securely stored and reviewed by our verification team.
          All information is kept confidential.
        </AlertDescription>
      </Alert>
    </div>
  );
};
