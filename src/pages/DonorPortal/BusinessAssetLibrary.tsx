import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  File,
  Trash2,
  Edit,
  Plus,
  Loader2,
  FolderOpen,
} from "lucide-react";

interface BusinessAsset {
  id: string;
  asset_name: string;
  asset_type: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
}

const ASSET_TYPES = [
  { value: "all", label: "All Assets" },
  { value: "logo", label: "Logos" },
  { value: "banner", label: "Banners" },
  { value: "image", label: "Images" },
  { value: "document", label: "Documents" },
  { value: "other", label: "Other" },
];

export default function BusinessAssetLibrary() {
  const { businessId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<BusinessAsset[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<BusinessAsset | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<BusinessAsset | null>(null);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetType, setNewAssetType] = useState("logo");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchAssets = async () => {
    if (!user || !businessId) return;

    try {
      // Fetch business name
      const { data: business } = await supabase
        .from('businesses')
        .select('business_name')
        .eq('id', businessId)
        .single();

      if (business) {
        setBusinessName(business.business_name);
      }

      // Fetch assets
      const { data, error } = await supabase
        .from('business_assets')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast({ title: "Error", description: "Failed to load assets", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [user, businessId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!newAssetName) {
        setNewAssetName(file.name.split('.')[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !businessId || !newAssetName) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${businessId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('business_assets')
        .insert({
          business_id: businessId,
          asset_name: newAssetName,
          asset_type: newAssetType,
          file_url: publicUrl,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size_bytes: selectedFile.size,
          created_by: user.id,
        });

      if (dbError) throw dbError;

      toast({ title: "Success", description: "Asset uploaded successfully" });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setNewAssetName("");
      setNewAssetType("logo");
      fetchAssets();
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast({ title: "Error", description: "Failed to upload asset", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;

    try {
      const { error } = await supabase
        .from('business_assets')
        .delete()
        .eq('id', assetToDelete.id);

      if (error) throw error;

      toast({ title: "Success", description: "Asset deleted" });
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
      fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({ title: "Error", description: "Failed to delete asset", variant: "destructive" });
    }
  };

  const handleEditSave = async () => {
    if (!assetToEdit || !newAssetName) return;

    try {
      const { error } = await supabase
        .from('business_assets')
        .update({ 
          asset_name: newAssetName,
          asset_type: newAssetType,
        })
        .eq('id', assetToEdit.id);

      if (error) throw error;

      toast({ title: "Success", description: "Asset updated" });
      setEditDialogOpen(false);
      setAssetToEdit(null);
      fetchAssets();
    } catch (error) {
      console.error('Error updating asset:', error);
      toast({ title: "Error", description: "Failed to update asset", variant: "destructive" });
    }
  };

  const openEditDialog = (asset: BusinessAsset) => {
    setAssetToEdit(asset);
    setNewAssetName(asset.asset_name);
    setNewAssetType(asset.asset_type);
    setEditDialogOpen(true);
  };

  const filteredAssets = filterType === "all" 
    ? assets 
    : assets.filter(a => a.asset_type === filterType);

  const isImage = (fileType: string | null) => fileType?.startsWith('image/');

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <DonorPortalLayout title="Asset Library">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </DonorPortalLayout>
    );
  }

  return (
    <DonorPortalLayout 
      title={`Asset Library - ${businessName}`}
      subtitle="Store and reuse assets across all your sponsorships"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button variant="ghost" asChild>
            <Link to={`/portal/businesses/${businessId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Business
            </Link>
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Asset
          </Button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Label className="text-sm text-muted-foreground">Filter:</Label>
          <div className="flex flex-wrap gap-2">
            {ASSET_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={filterType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Assets Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload logos, banners, and other files to reuse across campaigns.
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Asset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <Card key={asset.id} className="overflow-hidden group">
                <div className="aspect-square bg-muted relative flex items-center justify-center">
                  {isImage(asset.file_type) ? (
                    <img
                      src={asset.file_url}
                      alt={asset.asset_name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <File className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => openEditDialog(asset)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => {
                        setAssetToDelete(asset);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium truncate text-sm">{asset.asset_name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {asset.asset_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(asset.file_size_bytes)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Asset Name</Label>
              <Input
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                placeholder="e.g., Primary Logo"
              />
            </div>
            <div className="space-y-2">
              <Label>Asset Type</Label>
              <Select value={newAssetType} onValueChange={setNewAssetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.filter(t => t.value !== "all").map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                {selectedFile.type.startsWith('image/') ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <File className="h-4 w-4" />
                )}
                <span className="text-sm truncate">{selectedFile.name}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || !newAssetName || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Asset Name</Label>
              <Input
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Asset Type</Label>
              <Select value={newAssetType} onValueChange={setNewAssetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.filter(t => t.value !== "all").map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={!newAssetName}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{assetToDelete?.asset_name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DonorPortalLayout>
  );
}
