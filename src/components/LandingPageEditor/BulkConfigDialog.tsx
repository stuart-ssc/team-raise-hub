import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, Layers } from "lucide-react";
import { LandingPageBlock } from "./types";

interface BulkConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'school' | 'district';
  selectedEntities: Array<{
    id: string;
    name: string;
    city?: string;
    state?: string;
  }>;
  onComplete: () => void;
}

type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

interface ProcessingResult {
  entityId: string;
  entityName: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
}

export function BulkConfigDialog({
  open,
  onOpenChange,
  entityType,
  selectedEntities,
  onComplete,
}: BulkConfigDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [skipExisting, setSkipExisting] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [processedCount, setProcessedCount] = useState(0);
  const [results, setResults] = useState<ProcessingResult[]>([]);

  // Fetch templates for the entity type
  const { data: templates } = useQuery({
    queryKey: ["landing-page-templates", entityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_templates")
        .select("id, name, is_default, blocks")
        .eq("template_type", entityType)
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch existing configs to check which entities already have configurations
  const { data: existingConfigs } = useQuery({
    queryKey: ["existing-configs-bulk", selectedEntities.map(e => e.id)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_configs")
        .select("entity_id")
        .eq("entity_type", entityType)
        .in("entity_id", selectedEntities.map(e => e.id));
      if (error) throw error;
      return new Set(data?.map(c => c.entity_id) || []);
    },
    enabled: open && selectedEntities.length > 0,
  });

  const handleProcess = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }

    const template = templates?.find(t => t.id === selectedTemplateId);
    if (!template) {
      toast.error("Template not found");
      return;
    }

    setProcessingStatus('processing');
    setProcessedCount(0);
    setResults([]);

    const newResults: ProcessingResult[] = [];

    for (let i = 0; i < selectedEntities.length; i++) {
      const entity = selectedEntities[i];
      
      // Check if should skip existing
      if (skipExisting && existingConfigs?.has(entity.id)) {
        newResults.push({
          entityId: entity.id,
          entityName: entity.name,
          status: 'skipped',
          message: 'Already configured',
        });
        setProcessedCount(i + 1);
        setResults([...newResults]);
        continue;
      }

      try {
        // Upsert the configuration
        const { error } = await supabase
          .from("landing_page_configs")
          .upsert({
            entity_type: entityType,
            entity_id: entity.id,
            template_id: selectedTemplateId,
            custom_blocks: template.blocks as unknown as LandingPageBlock[],
            is_published: publishImmediately,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'entity_type,entity_id',
          });

        if (error) throw error;

        newResults.push({
          entityId: entity.id,
          entityName: entity.name,
          status: 'success',
        });
      } catch (error: any) {
        newResults.push({
          entityId: entity.id,
          entityName: entity.name,
          status: 'error',
          message: error.message,
        });
      }

      setProcessedCount(i + 1);
      setResults([...newResults]);

      // Small delay to avoid overwhelming the database
      if (i < selectedEntities.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    setProcessingStatus('completed');
    
    const successCount = newResults.filter(r => r.status === 'success').length;
    const skippedCount = newResults.filter(r => r.status === 'skipped').length;
    const errorCount = newResults.filter(r => r.status === 'error').length;

    if (errorCount === 0) {
      toast.success(`Successfully configured ${successCount} ${entityType}${successCount !== 1 ? 's' : ''}${skippedCount > 0 ? ` (${skippedCount} skipped)` : ''}`);
    } else {
      toast.warning(`Configured ${successCount}, skipped ${skippedCount}, failed ${errorCount}`);
    }
  };

  const handleClose = () => {
    if (processingStatus === 'processing') return;
    
    if (processingStatus === 'completed') {
      onComplete();
    }
    
    // Reset state
    setProcessingStatus('idle');
    setProcessedCount(0);
    setResults([]);
    setSelectedTemplateId("");
    setPublishImmediately(false);
    onOpenChange(false);
  };

  const progress = selectedEntities.length > 0 
    ? (processedCount / selectedEntities.length) * 100 
    : 0;

  const successCount = results.filter(r => r.status === 'success').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Bulk Configure Landing Pages
          </DialogTitle>
          <DialogDescription>
            Apply a template to {selectedEntities.length} selected {entityType}{selectedEntities.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {processingStatus === 'idle' && (
          <div className="space-y-6 py-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} {template.is_default && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No templates available for {entityType}s. Create one first.
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="publish">Publish immediately</Label>
                  <p className="text-sm text-muted-foreground">
                    Make pages live after configuration
                  </p>
                </div>
                <Switch
                  id="publish"
                  checked={publishImmediately}
                  onCheckedChange={setPublishImmediately}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="skip">Skip existing configurations</Label>
                  <p className="text-sm text-muted-foreground">
                    Don't overwrite pages that are already configured
                  </p>
                </div>
                <Switch
                  id="skip"
                  checked={skipExisting}
                  onCheckedChange={setSkipExisting}
                />
              </div>
            </div>

            {/* Preview count */}
            {existingConfigs && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  <strong>{selectedEntities.length - (skipExisting ? existingConfigs.size : 0)}</strong> {entityType}s will be configured
                  {skipExisting && existingConfigs.size > 0 && (
                    <span className="text-muted-foreground">
                      {" "}({existingConfigs.size} already configured, will be skipped)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {(processingStatus === 'processing' || processingStatus === 'completed') && (
          <div className="space-y-4 py-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{processedCount} / {selectedEntities.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Results summary */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                {successCount} success
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                {skippedCount} skipped
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errorCount} failed
                </div>
              )}
            </div>

            {/* Error details */}
            {errorCount > 0 && processingStatus === 'completed' && (
              <div className="max-h-32 overflow-y-auto rounded border p-2 text-sm">
                {results
                  .filter(r => r.status === 'error')
                  .map((r, i) => (
                    <div key={i} className="text-destructive">
                      {r.entityName}: {r.message}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {processingStatus === 'idle' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleProcess}
                disabled={!selectedTemplateId || templates?.length === 0}
              >
                Configure {selectedEntities.length} {entityType}{selectedEntities.length !== 1 ? 's' : ''}
              </Button>
            </>
          )}

          {processingStatus === 'processing' && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </Button>
          )}

          {processingStatus === 'completed' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
