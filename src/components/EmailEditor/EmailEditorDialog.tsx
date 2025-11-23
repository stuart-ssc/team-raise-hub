import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { EmailEditorProps, EmailBlock as EmailBlockType } from "./types";
import { BlockToolbar } from "./BlockToolbar";
import { EmailBlock } from "./EmailBlock";
import { emailLayouts } from "./EmailLayoutTemplates";
import { Eye, Sparkles, Save, Trash2 } from "lucide-react";

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

  useEffect(() => {
    if (open) {
      setShowLayoutSelection(blocks.length === 0);
    }
  }, [open, blocks.length]);

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

  const startFromScratch = () => {
    setBlocks([]);
    setSelectedLayoutId(null);
    setShowLayoutSelection(false);
  };

  const addBlock = (type: string) => {
    const newBlock: EmailBlockType = {
      id: `block-${Date.now()}`,
      type: type as any,
      content: "",
      styles: {},
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<EmailBlockType>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Visual Email Editor</DialogTitle>
          <DialogDescription>
            {showLayoutSelection 
              ? "Choose a layout template to start with or build from scratch"
              : "Build your email with drag-and-drop components"
            }
          </DialogDescription>
        </DialogHeader>

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

              <div className="flex justify-center">
                <Button variant="outline" onClick={startFromScratch}>
                  Start from Scratch
                </Button>
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
                  <div className="col-span-1">
                    <BlockToolbar onAddBlock={addBlock} />
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
                        <div className="space-y-4">
                          {blocks.map(block => (
                            <EmailBlock
                              key={block.id}
                              block={block}
                              onUpdate={updateBlock}
                              onDelete={deleteBlock}
                              onUploadImage={uploadImage}
                            />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-[calc(90vh-350px)]">
                <ScrollArea className="h-full border rounded-lg">
                  <div 
                    className="bg-white"
                    dangerouslySetInnerHTML={{ __html: generateHTML() }}
                  />
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
    </Dialog>
  );
}
