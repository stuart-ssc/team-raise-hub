import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { FileText, Plus, Settings, Trash2 } from "lucide-react";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface MessageTemplatesPickerProps {
  organizationId: string;
  onSelectTemplate: (content: string) => void;
  canManage?: boolean;
}

export const MessageTemplatesPicker = ({
  organizationId,
  onSelectTemplate,
  canManage = false,
}: MessageTemplatesPickerProps) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open || manageOpen) {
      fetchTemplates();
    }
  }, [open, manageOpen, organizationId]);

  const fetchTemplates = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("id, name, content, category")
        .eq("organization_id", organizationId)
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (template: MessageTemplate) => {
    onSelectTemplate(template.content);
    setOpen(false);
    toast.success(`Template "${template.name}" inserted`);
  };

  const handleSave = async () => {
    if (!newName.trim() || !newContent.trim()) {
      toast.error("Please fill in both name and content");
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from("message_templates")
          .update({
            name: newName.trim(),
            content: newContent.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast.success("Template updated");
      } else {
        const { error } = await supabase
          .from("message_templates")
          .insert({
            organization_id: organizationId,
            name: newName.trim(),
            content: newContent.trim(),
          });

        if (error) throw error;
        toast.success("Template created");
      }

      setEditingTemplate(null);
      setNewName("");
      setNewContent("");
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: MessageTemplate) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;

    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", template.id);

      if (error) throw error;
      toast.success("Template deleted");
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    }
  };

  const startEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setNewName(template.name);
    setNewContent(template.content);
  };

  const cancelEdit = () => {
    setEditingTemplate(null);
    setNewName("");
    setNewContent("");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" type="button" title="Quick replies">
            <FileText className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="font-medium text-sm">Quick Replies</span>
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setManageOpen(true);
                }}
              >
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-64">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : templates.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No templates yet.
                {canManage && (
                  <Button
                    variant="link"
                    size="sm"
                    className="block mx-auto mt-2"
                    onClick={() => {
                      setOpen(false);
                      setManageOpen(true);
                    }}
                  >
                    Create your first template
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-1">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                    onClick={() => handleSelect(template)}
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {template.content}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Manage Templates Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Message Templates</DialogTitle>
            <DialogDescription>
              Create quick reply templates for common messages
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex gap-4">
            {/* Template List */}
            <div className="w-1/3 border-r pr-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Templates</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    cancelEdit();
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>
              <ScrollArea className="h-64">
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No templates yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted ${
                          editingTemplate?.id === template.id ? "bg-muted" : ""
                        }`}
                        onClick={() => startEdit(template)}
                      >
                        <span className="text-sm truncate flex-1">
                          {template.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(template);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Edit Form */}
            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Thank you message"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="template-content">Message Content</Label>
                <Textarea
                  id="template-content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter the message template..."
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: You can personalize messages after inserting the template
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={saving || !newName.trim() || !newContent.trim()}>
              {saving ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
