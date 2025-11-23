import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { EmailEditorProps, EmailBlock as EmailBlockType } from "./types";
import { BlockToolbar } from "./BlockToolbar";
import { EmailBlock } from "./EmailBlock";
import { emailLayouts } from "./EmailLayoutTemplates";
import { Eye, Sparkles, Save, Trash2, Send, Monitor, Smartphone, Download, Upload, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface CustomLayout {
  id: string;
  name: string;
  description: string;
  blocks: EmailBlockType[];
  preview_color: string;
}

export function EmailEditorDialog({ open, onOpenChange, initialSubject, initialContent, onSave }: EmailEditorProps) {
  const queryClient = useQueryClient();
  const { organizationUser } = useOrganizationUser();
  const organizationId = organizationUser?.organization_id;

  const [subject, setSubject] = useState(initialSubject || "");
  const [blocks, setBlocks] = useState<EmailBlockType[]>([]);
  const [showLayoutSelection, setShowLayoutSelection] = useState(true);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [sendTestDialogOpen, setSendTestDialogOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [history, setHistory] = useState<EmailBlockType[][]>([]);
  const [redoStack, setRedoStack] = useState<EmailBlockType[][]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<Date | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftInfo, setDraftInfo] = useState<{timestamp: string, blockCount: number, subject: string} | null>(null);
  const [lastSavedState, setLastSavedState] = useState<{blocks: EmailBlockType[], subject: string} | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open) {
      setShowLayoutSelection(blocks.length === 0);
    }
  }, [open, blocks.length]);

  // Save to history before changes
  const saveHistory = () => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(blocks))]);
    setRedoStack([]);
  };

  // Undo function
  const undo = () => {
    if (history.length === 0) {
      toast.error("Nothing to undo");
      return;
    }

    const previousState = history[history.length - 1];
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(blocks))]);
    setHistory(prev => prev.slice(0, -1));
    setBlocks(previousState);
    toast.success("Undone");
  };

  // Redo function
  const redo = () => {
    if (redoStack.length === 0) {
      toast.error("Nothing to redo");
      return;
    }

    const nextState = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(blocks))]);
    setRedoStack(prev => prev.slice(0, -1));
    setBlocks(nextState);
    toast.success("Redone");
  };

  // Autosave functions
  const getDraftKey = () => {
    return `email-draft-${organizationId || 'global'}`;
  };

  const hasUnsavedChanges = () => {
    if (!lastSavedState) return blocks.length > 0 || subject.length > 0;
    return JSON.stringify(lastSavedState.blocks) !== JSON.stringify(blocks) ||
           lastSavedState.subject !== subject;
  };

  const autoSave = () => {
    const draftKey = getDraftKey();
    const draft = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      organizationId: organizationId || null,
      subject,
      blocks,
      metadata: {
        blockCount: blocks.length,
        lastModified: new Date().toISOString()
      }
    };
    
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      setAutoSaveStatus('saved');
      setLastAutoSaveTime(new Date());
      setLastSavedState({ blocks: JSON.parse(JSON.stringify(blocks)), subject });
    } catch (error) {
      console.error('Autosave failed:', error);
      toast.error("Unable to save draft. Storage may be full.");
    }
  };

  const hasDraft = () => {
    const draftKey = getDraftKey();
    const draftStr = localStorage.getItem(draftKey);
    
    if (!draftStr) return null;
    
    try {
      const draft = JSON.parse(draftStr);
      if (draft.version && draft.blocks && draft.subject !== undefined) {
        return {
          timestamp: draft.timestamp,
          blockCount: draft.metadata?.blockCount || 0,
          subject: draft.subject
        };
      }
    } catch (error) {
      console.error('Invalid draft data:', error);
    }
    
    return null;
  };

  const loadDraft = () => {
    const draftKey = getDraftKey();
    const draftStr = localStorage.getItem(draftKey);
    
    if (!draftStr) return;
    
    try {
      const draft = JSON.parse(draftStr);
      
      if (draft.blocks && Array.isArray(draft.blocks)) {
        saveHistory();
        setBlocks(draft.blocks);
        setSubject(draft.subject || '');
        setShowDraftBanner(false);
        setLastSavedState({ blocks: JSON.parse(JSON.stringify(draft.blocks)), subject: draft.subject || '' });
        toast.success("Draft restored");
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      toast.error("Unable to restore draft. The data may be corrupted.");
    }
  };

  const clearDraft = () => {
    const draftKey = getDraftKey();
    localStorage.removeItem(draftKey);
    setShowDraftBanner(false);
    setAutoSaveStatus('saved');
    setLastAutoSaveTime(null);
    setLastSavedState(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open || showLayoutSelection) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z to redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Ctrl/Cmd + D to duplicate selected block
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedBlockId) {
          duplicateBlock(selectedBlockId);
        } else {
          toast.error("Please select a block to duplicate");
        }
        return;
      }

      // Delete key to remove selected block
      if (e.key === 'Delete' && selectedBlockId) {
        e.preventDefault();
        deleteBlock(selectedBlockId);
        setSelectedBlockId(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, showLayoutSelection, selectedBlockId, blocks, history, redoStack]);

  // Draft detection on dialog open
  useEffect(() => {
    if (open && !showLayoutSelection) {
      const draft = hasDraft();
      if (draft) {
        setDraftInfo(draft);
        setShowDraftBanner(true);
      }
    }
  }, [open, showLayoutSelection]);

  // Autosave interval (every 30 seconds)
  useEffect(() => {
    if (!open || showLayoutSelection) return;

    const interval = setInterval(() => {
      if (hasUnsavedChanges()) {
        setAutoSaveStatus('saving');
        autoSave();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [open, showLayoutSelection, blocks, subject]);

  // Change detection
  useEffect(() => {
    if (!open || showLayoutSelection) return;

    if (hasUnsavedChanges()) {
      setAutoSaveStatus('unsaved');
    }
  }, [blocks, subject, open, showLayoutSelection]);

  // Fetch custom layouts
  const { data: customLayouts } = useQuery({
    queryKey: ["custom-email-layouts", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("custom_email_layouts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []).map(layout => ({
        ...layout,
        blocks: layout.blocks as unknown as EmailBlockType[]
      })) as CustomLayout[];
    },
    enabled: !!organizationId && open,
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("Organization not found");
      
      const { data: profile } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("custom_email_layouts")
        .insert({
          organization_id: organizationId,
          created_by: profile.user?.id,
          name: templateName,
          description: templateDescription,
          blocks: blocks as any,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-email-layouts"] });
      setSaveTemplateDialogOpen(false);
      setTemplateName("");
      setTemplateDescription("");
      toast.success("Template saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save template: " + error.message);
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("custom_email_layouts")
        .delete()
        .eq("id", templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-email-layouts"] });
      toast.success("Template deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete template: " + error.message);
    },
  });

  const loadLayout = (layoutId: string, isCustom = false) => {
    saveHistory();
    if (isCustom) {
      const customLayout = customLayouts?.find(l => l.id === layoutId);
      if (customLayout) {
        setBlocks(customLayout.blocks);
        setSelectedLayoutId(layoutId);
        setShowLayoutSelection(false);
        toast.success(`${customLayout.name} layout loaded`);
      }
    } else {
      const layout = emailLayouts.find(l => l.id === layoutId);
      if (layout) {
        setBlocks(layout.blocks);
        setSelectedLayoutId(layoutId);
        setShowLayoutSelection(false);
        toast.success(`${layout.name} layout loaded`);
      }
    }
  };

  const handleSaveAsTemplate = () => {
    if (blocks.length === 0) {
      toast.error("Please add some components before saving as template");
      return;
    }
    setSaveTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleExportTemplate = () => {
    if (blocks.length === 0) {
      toast.error("No content to export");
      return;
    }

    const exportData = {
      version: "1.0",
      subject: subject,
      blocks: blocks,
      exportedAt: new Date().toISOString(),
      metadata: {
        blockCount: blocks.length,
        editorVersion: "1.0"
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `email-template-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Template exported successfully");
  };

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
      toast.error("Please select a valid JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        // Validate structure
        if (!importedData.blocks || !Array.isArray(importedData.blocks)) {
          toast.error("Invalid template format: missing blocks array");
          return;
        }

        // Validate blocks
        const validBlocks = importedData.blocks.every((block: any) => 
          block.id && block.type && typeof block.content !== 'undefined' && block.styles
        );

        if (!validBlocks) {
          toast.error("Invalid template format: blocks structure is incorrect");
          return;
        }

        saveHistory();
        setBlocks(importedData.blocks);
        if (importedData.subject) {
          setSubject(importedData.subject);
        }
        setShowLayoutSelection(false);
        
        toast.success("Template imported successfully");
      } catch (error) {
        toast.error("Failed to parse template file");
        console.error("Import error:", error);
      }
    };

    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      saveHistory();
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
      toast.success("Block reordered");
    }
  };

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      if (!testEmailAddress.trim()) {
        throw new Error("Please enter an email address");
      }

      if (!subject.trim()) {
        throw new Error("Please enter a subject line");
      }

      if (blocks.length === 0) {
        throw new Error("Please add some email content");
      }

      const htmlContent = generateHTML();
      
      const { error } = await supabase.functions.invoke("send-test-email", {
        body: {
          recipientEmail: testEmailAddress,
          subject: subject,
          htmlContent: htmlContent,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setSendTestDialogOpen(false);
      toast.success("Test email sent successfully!");
    },
    onError: (error) => {
      toast.error("Failed to send test email: " + error.message);
    },
  });

  const startFromScratch = () => {
    saveHistory();
    setBlocks([]);
    setSelectedLayoutId(null);
    setShowLayoutSelection(false);
  };

  const addBlock = (type: string) => {
    saveHistory();
    const newBlock: EmailBlockType = {
      id: `block-${Date.now()}`,
      type: type as any,
      content: "",
      styles: {},
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<EmailBlockType>) => {
    saveHistory();
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    saveHistory();
    setBlocks(blocks.filter(block => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const duplicateBlock = (id: string) => {
    const blockIndex = blocks.findIndex(block => block.id === id);
    if (blockIndex === -1) return;
    
    saveHistory();
    const blockToDuplicate = blocks[blockIndex];
    const duplicatedBlock: EmailBlockType = {
      ...blockToDuplicate,
      id: `block-${Date.now()}`,
    };
    
    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
    setBlocks(newBlocks);
    setSelectedBlockId(duplicatedBlock.id);
    toast.success("Block duplicated");
  };

  const uploadImage = async (blockId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('email-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('email-images')
        .getPublicUrl(filePath);

      updateBlock(blockId, {
        styles: {
          ...blocks.find(b => b.id === blockId)?.styles,
          imageUrl: publicUrl,
        }
      });

      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload image: " + error.message);
    }
  };

  const generateHTML = () => {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">`;

    blocks.forEach(block => {
      const { type, content, styles } = block;

      switch (type) {
        case 'heading':
          html += `
              <h2 style="font-size: ${styles.fontSize || '24px'}; color: ${styles.color || '#000000'}; text-align: ${styles.textAlign || 'left'}; font-weight: ${styles.fontWeight || 'bold'}; margin: 0 0 20px 0;">
                ${content || 'Heading Text'}
              </h2>`;
          break;
        case 'paragraph':
          html += `
              <p style="font-size: ${styles.fontSize || '16px'}; color: ${styles.color || '#000000'}; text-align: ${styles.textAlign || 'left'}; line-height: 1.6; margin: 0 0 20px 0;">
                ${content || 'Paragraph text goes here'}
              </p>`;
          break;
        case 'button':
          html += `
              <div style="text-align: ${styles.textAlign || 'center'}; margin: 20px 0;">
                <a href="${styles.buttonUrl || '#'}" style="display: inline-block; padding: 12px 24px; background-color: ${styles.buttonColor || '#0066cc'}; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  ${styles.buttonText || 'Click Here'}
                </a>
              </div>`;
          break;
        case 'image':
          if (styles.imageUrl) {
            html += `
              <div style="text-align: ${styles.textAlign || 'center'}; margin: 20px 0;">
                <img src="${styles.imageUrl}" alt="${styles.imageAlt || 'Email image'}" style="max-width: ${styles.imageWidth || '100%'}; height: auto; display: inline-block;">
              </div>`;
          }
          break;
        case 'divider':
          html += `
              <hr style="border: none; border-top: 1px solid #dddddd; margin: 20px 0;">`;
          break;
        case 'spacer':
          html += `
              <div style="height: ${styles.spacerHeight || '20px'};"></div>`;
          break;
      }
    });

    html += `
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return html;
  };

  const handleSave = () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject line");
      return;
    }

    if (blocks.length === 0) {
      toast.error("Please add at least one component to your email");
      return;
    }

    const htmlContent = generateHTML();
    onSave(subject, htmlContent);
    clearDraft(); // Clear autosave draft after successful save
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Visual Email Editor</DialogTitle>
              <DialogDescription>
                {showLayoutSelection 
                  ? "Choose a layout template to start with or build from scratch"
                  : "Build your email with drag-and-drop components"
                }
              </DialogDescription>
            </div>
            {!showLayoutSelection && (
              <div className="flex items-center gap-2 text-sm">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
                {autoSaveStatus === 'saved' && lastAutoSaveTime && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Saved</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.floor((Date.now() - lastAutoSaveTime.getTime()) / 60000) || 0}m ago
                    </span>
                  </div>
                )}
                {autoSaveStatus === 'unsaved' && (
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Unsaved changes</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Draft Recovery Banner */}
        {showDraftBanner && draftInfo && !showLayoutSelection && (
          <div className="mx-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Draft Found</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Draft from {new Date(draftInfo.timestamp).toLocaleString()} with {draftInfo.blockCount} blocks
                  {draftInfo.subject && ` - "${draftInfo.subject.substring(0, 50)}${draftInfo.subject.length > 50 ? '...' : ''}"`}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={loadDraft}>
                    Restore Draft
                  </Button>
                  <Button size="sm" onClick={clearDraft} variant="outline">
                    Discard
                  </Button>
                </div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="flex-shrink-0"
              onClick={() => setShowDraftBanner(false)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {showLayoutSelection ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Pre-designed Layouts */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Pre-designed Layouts</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {emailLayouts.map((layout) => (
                    <Card 
                      key={layout.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => loadLayout(layout.id, false)}
                    >
                      <CardHeader>
                        <div className={`h-24 rounded-md mb-3 ${layout.preview} flex items-center justify-center`}>
                          <Sparkles className="h-8 w-8 text-white/80" />
                        </div>
                        <CardTitle className="text-lg">{layout.name}</CardTitle>
                        <CardDescription>{layout.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Custom Layouts */}
              {customLayouts && customLayouts.length > 0 && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Your Custom Templates</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {customLayouts.map((layout) => (
                      <Card 
                        key={layout.id}
                        className="cursor-pointer hover:border-primary transition-colors group relative"
                      >
                        <CardHeader onClick={() => loadLayout(layout.id, true)}>
                          <div className={`h-24 rounded-md mb-3 ${layout.preview_color} flex items-center justify-center`}>
                            <Save className="h-8 w-8 text-white/80" />
                          </div>
                          <CardTitle className="text-lg">{layout.name}</CardTitle>
                          <CardDescription>{layout.description || "Custom template"}</CardDescription>
                        </CardHeader>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(layout.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <Button variant="outline" onClick={startFromScratch}>
                  Start from Scratch
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Import/Export</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('template-import')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import Template
                  </Button>
                  <input
                    id="template-import"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportTemplate}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Subject Line</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>
              {selectedLayoutId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLayoutSelection(true)}
                  className="ml-4"
                >
                  Change Layout
                </Button>
              )}
            </div>

            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="h-[calc(90vh-350px)]">
                <div className="grid grid-cols-4 gap-4 h-full">
                  <div className="col-span-1 space-y-4">
                    <BlockToolbar onAddBlock={addBlock} />
                    <Card className="p-3 bg-muted/50">
                      <p className="text-xs font-semibold mb-2">Keyboard Shortcuts</p>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">Ctrl+Z</kbd>
                          <span>Undo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">Ctrl+Shift+Z</kbd>
                          <span>Redo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">Ctrl+S</kbd>
                          <span>Save</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">Ctrl+D</kbd>
                          <span>Duplicate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="px-1.5 py-0.5 bg-background rounded text-xs border">Delete</kbd>
                          <span>Remove</span>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3 bg-muted/50">
                      <p className="text-xs font-semibold mb-2">Template Tools</p>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={handleExportTemplate}
                          disabled={blocks.length === 0}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export as JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => document.getElementById('template-import-editor')?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Import from JSON
                        </Button>
                        <input
                          id="template-import-editor"
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleImportTemplate}
                        />
                      </div>
                    </Card>
                  </div>
                  <div className="col-span-3">
                    <ScrollArea className="h-full border rounded-lg p-4 bg-muted/20">
                      {blocks.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                          <div>
                            <p className="mb-2">No components yet</p>
                            <p className="text-sm">Add components from the toolbar to start building your email</p>
                          </div>
                        </div>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                              {blocks.map(block => (
                      <EmailBlock
                        key={block.id}
                        block={block}
                        onUpdate={updateBlock}
                        onDelete={deleteBlock}
                        onDuplicate={duplicateBlock}
                        onUploadImage={uploadImage}
                        isSelected={selectedBlockId === block.id}
                        onSelect={(id) => setSelectedBlockId(id)}
                      />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>

            <TabsContent value="preview" className="h-[calc(90vh-350px)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Device Preview:</Label>
                  <ToggleGroup type="single" value={deviceView} onValueChange={(value) => value && setDeviceView(value as "desktop" | "mobile")}>
                    <ToggleGroupItem value="desktop" aria-label="Desktop view">
                      <Monitor className="h-4 w-4 mr-2" />
                      Desktop
                    </ToggleGroupItem>
                    <ToggleGroupItem value="mobile" aria-label="Mobile view">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Mobile
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSendTestDialogOpen(true)}
                  disabled={blocks.length === 0 || !subject.trim()}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </Button>
              </div>
              <ScrollArea className="h-[calc(100%-60px)] border rounded-lg">
                <div 
                  className="bg-muted/30 flex items-center justify-center p-8"
                  style={{ minHeight: "100%" }}
                >
                  <div 
                    className={`bg-white shadow-lg transition-all ${
                      deviceView === "mobile" ? "max-w-[375px]" : "max-w-[600px]"
                    } w-full`}
                    dangerouslySetInnerHTML={{ __html: generateHTML() }}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={handleSaveAsTemplate}>
                <Save className="mr-2 h-4 w-4" />
                Save as Template
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Email
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Save Template Dialog */}
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this email layout as a reusable template for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Monthly Newsletter"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe when to use this template..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => saveTemplateMutation.mutate()}
                disabled={!templateName.trim() || saveTemplateMutation.isPending}
              >
                {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Test Email Dialog */}
      <Dialog open={sendTestDialogOpen} onOpenChange={setSendTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to preview how it will look in your inbox
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Recipient Email Address</Label>
              <Input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="your.email@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The subject will be prefixed with [TEST]
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSendTestDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => sendTestEmailMutation.mutate()}
                disabled={!testEmailAddress.trim() || sendTestEmailMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                {sendTestEmailMutation.isPending ? "Sending..." : "Send Test"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
