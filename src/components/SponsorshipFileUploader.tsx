import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Link as LinkIcon,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  help_text?: string;
}

interface FileUploadValue {
  type: 'file' | 'url';
  value: string; // URL or file path
  fileName?: string;
}

interface SponsorshipFileUploaderProps {
  orderId: string;
  campaignId: string;
  fileFields: CustomField[];
  deadlineDays?: number;
  orderCreatedAt: string;
  onComplete?: () => void;
}

export const SponsorshipFileUploader = ({
  orderId,
  campaignId,
  fileFields,
  deadlineDays,
  orderCreatedAt,
  onComplete
}: SponsorshipFileUploaderProps) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, FileUploadValue>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [externalUrls, setExternalUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!deadlineDays) return null;
    const createdDate = new Date(orderCreatedAt);
    const deadline = new Date(createdDate);
    deadline.setDate(deadline.getDate() + deadlineDays);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days: diffDays, deadline };
  };

  const daysRemaining = getDaysRemaining();

  // Load existing file values
  useEffect(() => {
    const loadExistingFiles = async () => {
      try {
        const { data, error } = await supabase
          .from('order_custom_field_values')
          .select('field_id, field_value')
          .eq('order_id', orderId)
          .in('field_id', fileFields.map(f => f.id));

        if (error) throw error;

        const existingFiles: Record<string, FileUploadValue> = {};
        data?.forEach(item => {
          if (item.field_value) {
            try {
              const parsed = JSON.parse(item.field_value);
              existingFiles[item.field_id] = parsed;
            } catch {
              // Legacy format - just a URL string
              existingFiles[item.field_id] = {
                type: 'url',
                value: item.field_value
              };
            }
          }
        });

        setUploadedFiles(existingFiles);
      } catch (error) {
        console.error('Error loading existing files:', error);
      }
    };

    loadExistingFiles();
  }, [orderId, fileFields]);

  // Calculate progress
  const requiredFileFields = fileFields.filter(f => f.is_required);
  const uploadedRequiredCount = requiredFileFields.filter(f => uploadedFiles[f.id]).length;
  const progress = requiredFileFields.length > 0 
    ? (uploadedRequiredCount / requiredFileFields.length) * 100 
    : 0;
  const allRequiredFilesUploaded = requiredFileFields.length > 0 && 
    uploadedRequiredCount === requiredFileFields.length;

  const handleFileSelect = async (fieldId: string, file: File) => {
    if (!file) return;

    // Validate file size (max 20MB)
    const maxSizeBytes = 20 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size must be less than 20MB.",
      });
      return;
    }

    setUploading(fieldId);

    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}/${fieldId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('sponsorship-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sponsorship-files')
        .getPublicUrl(fileName);

      const fileValue: FileUploadValue = {
        type: 'file',
        value: publicUrl,
        fileName: file.name
      };

      // Save to database
      await saveFileValue(fieldId, fileValue);

      setUploadedFiles(prev => ({
        ...prev,
        [fieldId]: fileValue
      }));

      toast({
        title: "Success",
        description: "File uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please try again.",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleExternalUrlSave = async (fieldId: string) => {
    const url = externalUrls[fieldId]?.trim();
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL.",
      });
      return;
    }

    setUploading(fieldId);

    try {
      const fileValue: FileUploadValue = {
        type: 'url',
        value: url
      };

      await saveFileValue(fieldId, fileValue);

      setUploadedFiles(prev => ({
        ...prev,
        [fieldId]: fileValue
      }));

      setExternalUrls(prev => ({ ...prev, [fieldId]: '' }));

      toast({
        title: "Success",
        description: "External URL saved successfully.",
      });
    } catch (error: any) {
      console.error("Error saving URL:", error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Failed to save URL. Please try again.",
      });
    } finally {
      setUploading(null);
    }
  };

  const saveFileValue = async (fieldId: string, fileValue: FileUploadValue) => {
    // Upsert the file value
    const { error: upsertError } = await supabase
      .from('order_custom_field_values')
      .upsert({
        order_id: orderId,
        field_id: fieldId,
        field_value: JSON.stringify(fileValue)
      }, {
        onConflict: 'order_id,field_id'
      });

    if (upsertError) throw upsertError;

    // Check if all required files are now uploaded
    const updatedFiles = { ...uploadedFiles, [fieldId]: fileValue };
    const allComplete = requiredFileFields.every(f => updatedFiles[f.id]);

    if (allComplete) {
      // Update order to mark files as complete
      const { error: orderError } = await supabase
        .from('orders')
        .update({ files_complete: true })
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating order:', orderError);
      } else if (onComplete) {
        onComplete();
      }
    }
  };

  const handleRemoveFile = async (fieldId: string) => {
    try {
      const fileData = uploadedFiles[fieldId];
      
      // If it's a file upload, try to delete from storage
      if (fileData.type === 'file') {
        const urlParts = fileData.value.split('/sponsorship-files/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage
            .from('sponsorship-files')
            .remove([filePath]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('order_custom_field_values')
        .delete()
        .eq('order_id', orderId)
        .eq('field_id', fieldId);

      if (error) throw error;

      setUploadedFiles(prev => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });

      // Update order files_complete status
      await supabase
        .from('orders')
        .update({ files_complete: false })
        .eq('id', orderId);

      toast({
        title: "Success",
        description: "File removed successfully.",
      });
    } catch (error: any) {
      console.error("Error removing file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove file.",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    setDragOver(fieldId);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = async (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileSelect(fieldId, files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with deadline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Required Files</h3>
          {daysRemaining && (
            <div className={cn(
              "flex items-center gap-2 text-sm",
              daysRemaining.days <= 3 ? "text-destructive" : 
              daysRemaining.days <= 7 ? "text-warning-foreground" : 
              "text-muted-foreground"
            )}>
              <Clock className="h-4 w-4" />
              {daysRemaining.days > 0 ? (
                <span>{daysRemaining.days} day{daysRemaining.days !== 1 ? 's' : ''} remaining</span>
              ) : (
                <span className="font-semibold">Deadline passed</span>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {requiredFileFields.length > 0 && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {uploadedRequiredCount} of {requiredFileFields.length} required files uploaded
            </p>
          </div>
        )}
      </div>

      {/* Deadline warning */}
      {daysRemaining && daysRemaining.days <= 3 && !allRequiredFilesUploaded && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Deadline approaching! Please upload all required files by{' '}
            {daysRemaining.deadline.toLocaleDateString()}.
          </AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {allRequiredFilesUploaded && (
        <Alert className="border-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success-foreground">
            All required files have been uploaded! Thank you for completing your submission.
          </AlertDescription>
        </Alert>
      )}

      {/* File upload fields */}
      <div className="space-y-4">
        {fileFields.map(field => (
          <Card key={field.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {field.field_name}
                {field.is_required && (
                  <span className="text-destructive">*</span>
                )}
                {uploadedFiles[field.id] && (
                  <CheckCircle2 className="h-4 w-4 text-success ml-auto" />
                )}
              </CardTitle>
              {field.help_text && (
                <CardDescription>{field.help_text}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {uploadedFiles[field.id] ? (
                // Show uploaded file
                <Alert className="border-success bg-success/10">
                  <FileText className="h-4 w-4 text-success" />
                  <AlertDescription className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {uploadedFiles[field.id].type === 'file' 
                          ? uploadedFiles[field.id].fileName 
                          : 'External URL'}
                      </p>
                      {uploadedFiles[field.id].type === 'url' && (
                        <a 
                          href={uploadedFiles[field.id].value} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <LinkIcon className="h-3 w-3" />
                          {uploadedFiles[field.id].value}
                        </a>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(field.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                // Upload options
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                    <TabsTrigger value="url">External URL</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-4">
                    <div
                      onDragOver={(e) => handleDragOver(e, field.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, field.id)}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                        dragOver === field.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium mb-2">
                        Drag and drop your file here
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        or click to browse (max 20MB)
                      </p>
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(field.id, file);
                        }}
                        disabled={uploading === field.id}
                        className="max-w-xs mx-auto cursor-pointer"
                      />
                      {uploading === field.id && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Uploading...
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`url-${field.id}`}>
                        External File URL
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Provide a link to your file (Google Drive, Dropbox, etc.)
                      </p>
                      <div className="flex gap-2">
                        <Input
                          id={`url-${field.id}`}
                          type="url"
                          placeholder="https://example.com/your-file"
                          value={externalUrls[field.id] || ''}
                          onChange={(e) => setExternalUrls(prev => ({
                            ...prev,
                            [field.id]: e.target.value
                          }))}
                          disabled={uploading === field.id}
                        />
                        <Button
                          onClick={() => handleExternalUrlSave(field.id)}
                          disabled={!externalUrls[field.id]?.trim() || uploading === field.id}
                        >
                          Save URL
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Files are securely stored and will only be accessible to authorized organization members.
          You can update or replace files at any time before the deadline.
        </AlertDescription>
      </Alert>
    </div>
  );
};
