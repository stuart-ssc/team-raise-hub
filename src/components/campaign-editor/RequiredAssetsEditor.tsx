import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, GripVertical, Image, FileText, File } from "lucide-react";

export interface RequiredAsset {
  id?: string;
  asset_name: string;
  asset_description: string;
  file_types: string[];
  max_file_size_mb: number;
  dimensions_hint: string;
  is_required: boolean;
  display_order: number;
  campaign_item_id?: string | null;
}

interface RequiredAssetsEditorProps {
  assets: RequiredAsset[];
  onChange: (assets: RequiredAsset[]) => void;
  /** When provided, the editor labels itself for a specific item. */
  itemLabel?: string;
}

const FILE_TYPE_OPTIONS = [
  { value: "image/png", label: "PNG Image" },
  { value: "image/jpeg", label: "JPEG Image" },
  { value: "image/gif", label: "GIF Image" },
  { value: "image/svg+xml", label: "SVG Image" },
  { value: "application/pdf", label: "PDF Document" },
  { value: "application/msword", label: "Word Document" },
  { value: "video/mp4", label: "MP4 Video" },
];

const PRESET_TEMPLATES = [
  {
    name: "Company Logo",
    description: "Your company logo for recognition in fundraiser materials",
    file_types: ["image/png", "image/jpeg", "image/svg+xml"],
    dimensions_hint: "400x400px minimum, transparent background preferred",
    is_required: true,
  },
  {
    name: "Banner Ad",
    description: "Banner advertisement for program materials",
    file_types: ["image/png", "image/jpeg"],
    dimensions_hint: "300x250px or 728x90px",
    is_required: true,
  },
  {
    name: "Full Page Ad",
    description: "Full page advertisement for printed materials",
    file_types: ["application/pdf", "image/png", "image/jpeg"],
    dimensions_hint: "8.5x11 inches, 300 DPI minimum",
    is_required: false,
  },
];

export function RequiredAssetsEditor({ assets, onChange, itemLabel }: RequiredAssetsEditorProps) {
  const [editingAsset, setEditingAsset] = useState<RequiredAsset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);

  const handleAddAsset = () => {
    setEditingAsset({
      asset_name: "",
      asset_description: "",
      file_types: ["image/png", "image/jpeg"],
      max_file_size_mb: 10,
      dimensions_hint: "",
      is_required: true,
      display_order: assets.length,
    });
    setSelectedFileTypes(["image/png", "image/jpeg"]);
    setIsDialogOpen(true);
  };

  const handleEditAsset = (asset: RequiredAsset, index: number) => {
    setEditingAsset({ ...asset, display_order: index });
    setSelectedFileTypes(asset.file_types || []);
    setIsDialogOpen(true);
  };

  const handleSaveAsset = () => {
    if (!editingAsset || !editingAsset.asset_name.trim()) return;

    const assetToSave = { ...editingAsset, file_types: selectedFileTypes };
    
    if (editingAsset.id || assets.some((a, i) => i === editingAsset.display_order && a.id)) {
      // Editing existing asset
      const newAssets = assets.map((a, i) => 
        i === editingAsset.display_order ? assetToSave : a
      );
      onChange(newAssets);
    } else if (editingAsset.display_order < assets.length) {
      // Editing unsaved asset
      const newAssets = [...assets];
      newAssets[editingAsset.display_order] = assetToSave;
      onChange(newAssets);
    } else {
      // Adding new asset
      onChange([...assets, assetToSave]);
    }
    
    setIsDialogOpen(false);
    setEditingAsset(null);
  };

  const handleDeleteAsset = (index: number) => {
    const newAssets = assets.filter((_, i) => i !== index);
    onChange(newAssets.map((a, i) => ({ ...a, display_order: i })));
  };

  const handleAddFromTemplate = (template: typeof PRESET_TEMPLATES[0]) => {
    const newAsset: RequiredAsset = {
      asset_name: template.name,
      asset_description: template.description,
      file_types: template.file_types,
      dimensions_hint: template.dimensions_hint,
      is_required: template.is_required,
      max_file_size_mb: 10,
      display_order: assets.length,
    };
    onChange([...assets, newAsset]);
  };

  const toggleFileType = (fileType: string) => {
    setSelectedFileTypes(prev => 
      prev.includes(fileType) 
        ? prev.filter(t => t !== fileType)
        : [...prev, fileType]
    );
  };

  const getFileTypeIcon = (fileTypes: string[]) => {
    if (fileTypes.some(t => t.startsWith("image/"))) return <Image className="h-4 w-4" />;
    if (fileTypes.some(t => t === "application/pdf")) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileTypes = (fileTypes: string[]) => {
    return fileTypes.map(t => {
      const option = FILE_TYPE_OPTIONS.find(o => o.value === t);
      return option?.label.split(" ")[0] || t;
    }).join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">
          {itemLabel ? `Required Assets for ${itemLabel}` : "Required Sponsor Assets"}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAddAsset}>
          <Plus className="h-4 w-4 mr-1" />
          Add Asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <div className="border rounded-lg p-6 text-center space-y-4">
          <p className="text-muted-foreground">
            No required assets defined. Add assets that sponsors need to provide.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {PRESET_TEMPLATES.map((template) => (
              <Button
                key={template.name}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddFromTemplate(template)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {assets.map((asset, index) => (
            <div
              key={asset.id || index}
              className="flex items-center gap-3 border rounded-lg p-3"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div className="flex items-center gap-2 text-muted-foreground">
                {getFileTypeIcon(asset.file_types)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{asset.asset_name}</span>
                  {asset.is_required ? (
                    <Badge variant="default" className="text-xs">Required</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {asset.asset_description || formatFileTypes(asset.file_types)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditAsset(asset, index)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteAsset(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Quick add buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {PRESET_TEMPLATES.filter(t => !assets.some(a => a.asset_name === t.name)).map((template) => (
              <Button
                key={template.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddFromTemplate(template)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAsset?.id ? "Edit Asset Requirement" : "Add Asset Requirement"}
            </DialogTitle>
            <DialogDescription>
              Define what file sponsors need to provide for this fundraiser.
            </DialogDescription>
          </DialogHeader>

          {editingAsset && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="asset_name">Asset Name *</Label>
                <Input
                  id="asset_name"
                  value={editingAsset.asset_name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, asset_name: e.target.value })}
                  placeholder="e.g., Company Logo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset_description">Description / Instructions</Label>
                <Textarea
                  id="asset_description"
                  value={editingAsset.asset_description}
                  onChange={(e) => setEditingAsset({ ...editingAsset, asset_description: e.target.value })}
                  placeholder="Describe what you need and any specifications..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Accepted File Types</Label>
                <div className="flex flex-wrap gap-2">
                  {FILE_TYPE_OPTIONS.map((option) => (
                    <Badge
                      key={option.value}
                      variant={selectedFileTypes.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFileType(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions_hint">Size / Dimensions Hint</Label>
                <Input
                  id="dimensions_hint"
                  value={editingAsset.dimensions_hint}
                  onChange={(e) => setEditingAsset({ ...editingAsset, dimensions_hint: e.target.value })}
                  placeholder="e.g., 400x400px minimum"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_file_size">Max File Size (MB)</Label>
                  <Input
                    id="max_file_size"
                    type="number"
                    value={editingAsset.max_file_size_mb}
                    onChange={(e) => setEditingAsset({ ...editingAsset, max_file_size_mb: parseInt(e.target.value) || 10 })}
                    min={1}
                    max={50}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="is_required"
                    checked={editingAsset.is_required}
                    onCheckedChange={(checked) => setEditingAsset({ ...editingAsset, is_required: checked })}
                  />
                  <Label htmlFor="is_required">Required</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveAsset} disabled={!editingAsset?.asset_name.trim()}>
              {editingAsset?.id ? "Save Changes" : "Add Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
