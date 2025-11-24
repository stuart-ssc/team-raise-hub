import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { getTagColor, getTagBgColor } from "@/lib/utils";

interface BulkTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDonorIds: string[];
  onComplete: () => void;
}

const BulkTagDialog = ({
  open,
  onOpenChange,
  selectedDonorIds,
  onComplete,
}: BulkTagDialogProps) => {
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSave = async () => {
    if (tags.length === 0) {
      toast({
        title: "No Tags",
        description: "Please add at least one tag",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("bulk-tag-donors", {
        body: {
          donorIds: selectedDonorIds,
          tags,
        },
      });

      if (error) throw error;

      toast({
        title: "Tags Added",
        description: `Successfully added tags to ${data.updated} donors`,
      });

      onComplete();
      onOpenChange(false);
      setTags([]);
    } catch (error) {
      console.error("Error adding tags:", error);
      toast({
        title: "Error",
        description: "Failed to add tags to donors",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tags to Donors</DialogTitle>
          <DialogDescription>
            Add tags to {selectedDonorIds.length} selected {selectedDonorIds.length === 1 ? "donor" : "donors"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tag-input">Tags</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="tag-input"
                placeholder="Enter tag name..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button onClick={addTag} size="icon" variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter or click + to add tag
            </p>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags to add ({tags.length})</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="gap-1 border"
                    style={{
                      backgroundColor: getTagBgColor(tag),
                      color: getTagColor(tag),
                      borderColor: getTagColor(tag)
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || tags.length === 0}>
            {saving ? "Adding..." : `Add Tags to ${selectedDonorIds.length} Donors`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkTagDialog;
