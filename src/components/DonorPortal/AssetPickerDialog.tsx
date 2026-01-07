import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  FolderOpen,
  File,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface BusinessAsset {
  id: string;
  asset_name: string;
  asset_type: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size_bytes: number | null;
}

interface AssetPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  assetName: string;
  acceptedTypes?: string[];
  maxSizeMb?: number;
  onSelect: (asset: { 
    file_url: string; 
    file_name: string; 
    file_type: string;
    business_asset_id?: string;
  }) => void;
}

export function AssetPickerDialog({
  open,
  onOpenChange,
  businessId,
  assetName,
  acceptedTypes,
  maxSizeMb,
  onSelect,
}: AssetPickerDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<BusinessAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<BusinessAsset | null>(null);
  const [activeTab, setActiveTab] = useState<string>("library");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [newAssetName, setNewAssetName] = useState("");

  useEffect(() => {
    if (open && businessId) {
      fetchAssets();
    }
  }, [open, businessId]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_assets')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
      
      // If no assets, switch to upload tab
      if (!data || data.length === 0) {
        setActiveTab("upload");
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMb}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (acceptedTypes && acceptedTypes.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const allowed = acceptedTypes.map(t => t.toLowerCase().replace('.', ''));
      if (ext && !allowed.includes(ext)) {
        toast({
          title: "Invalid file type",
          description: `Allowed types: ${acceptedTypes.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
    }

    setSelectedFile(file);
    if (!newAssetName) {
      setNewAssetName(file.name.split('.')[0]);
    }
  };

  const handleSelectFromLibrary = () => {
    if (!selectedAsset) return;
    
    onSelect({
      file_url: selectedAsset.file_url,
      file_name: selectedAsset.file_name,
      file_type: selectedAsset.file_type || 'application/octet-stream',
      business_asset_id: selectedAsset.id,
    });
    
    onOpenChange(false);
    resetState();
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${businessId}/${Date.now()}.${fileExt}`;

      // Upload to sponsor-assets bucket (same bucket as direct uploads)
      const { error: uploadError } = await supabase.storage
        .from('sponsor-assets')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sponsor-assets')
        .getPublicUrl(fileName);

      let businessAssetId: string | undefined;

      // If save to library is checked, create a business_assets record
      if (saveToLibrary) {
        const { data: assetData, error: assetError } = await supabase
          .from('business_assets')
          .insert({
            business_id: businessId,
            asset_name: newAssetName || selectedFile.name.split('.')[0],
            asset_type: selectedFile.type.startsWith('image/') ? 'image' : 'document',
            file_url: publicUrl,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            file_size_bytes: selectedFile.size,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (!assetError && assetData) {
          businessAssetId = assetData.id;
        }
      }

      onSelect({
        file_url: publicUrl,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        business_asset_id: businessAssetId,
      });

      toast({ title: "Success", description: "File uploaded successfully" });
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Error uploading:', error);
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setSelectedAsset(null);
    setSelectedFile(null);
    setNewAssetName("");
    setSaveToLibrary(true);
    setActiveTab("library");
  };

  const getAcceptedTypes = () => {
    if (!acceptedTypes?.length) return undefined;
    return acceptedTypes.map(t => t.startsWith('.') ? t : `.${t}`).join(',');
  };

  const isImage = (fileType: string | null) => fileType?.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select {assetName}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Choose from Library
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 overflow-auto mt-4">
            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-3">No assets in your library yet</p>
                <Button variant="outline" onClick={() => setActiveTab("upload")}>
                  Upload Your First Asset
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                      selectedAsset?.id === asset.id 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      {isImage(asset.file_type) ? (
                        <img
                          src={asset.file_url}
                          alt={asset.asset_name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <File className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    {selectedAsset?.id === asset.id && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-1.5">
                      <p className="text-xs font-medium truncate">{asset.asset_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select File</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept={getAcceptedTypes()}
                />
                {acceptedTypes?.length && (
                  <p className="text-xs text-muted-foreground">
                    Accepted: {acceptedTypes.join(', ')}
                    {maxSizeMb && ` • Max ${maxSizeMb}MB`}
                  </p>
                )}
              </div>

              {selectedFile && (
                <>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {selectedFile.type.startsWith('image/') ? (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <File className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Badge variant="secondary">{selectedFile.type.split('/')[1]}</Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="save-to-library"
                      checked={saveToLibrary}
                      onCheckedChange={(checked) => setSaveToLibrary(checked as boolean)}
                    />
                    <label
                      htmlFor="save-to-library"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Save to my asset library for reuse
                    </label>
                  </div>

                  {saveToLibrary && (
                    <div className="space-y-2">
                      <Label>Asset Name (for library)</Label>
                      <Input
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                        placeholder="e.g., Company Logo"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === "library" ? (
            <Button onClick={handleSelectFromLibrary} disabled={!selectedAsset}>
              Use Selected Asset
            </Button>
          ) : (
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Use
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
