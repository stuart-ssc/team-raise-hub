import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, HelpCircle, Package, ArrowLeft } from "lucide-react";
import { SizeVariantsEditor, SizeVariant } from "@/components/SizeVariantsEditor";

interface CampaignItem {
  id?: string;
  name: string;
  description?: string;
  cost: number;
  quantityOffered: number;
  quantityAvailable: number;
  maxItemsPurchased?: number;
  size?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  image?: string;
  isRecurring?: boolean;
  recurringInterval?: 'month' | 'year';
  hasVariants?: boolean;
  variants?: SizeVariantData[];
}

interface SizeVariantData {
  id?: string;
  size: string;
  quantity_offered: number;
  quantity_available: number;
  display_order: number;
}

interface CampaignItemsSectionProps {
  campaignId: string;
}

export function CampaignItemsSection({ campaignId }: CampaignItemsSectionProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<CampaignItem[]>([]);
  const [editingItem, setEditingItem] = useState<CampaignItem | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [sizeVariants, setSizeVariants] = useState<SizeVariant[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cost: "",
    quantityOffered: "",
    quantityAvailable: "",
    maxItemsPurchased: "",
    size: "",
    eventStartDate: "",
    eventEndDate: "",
    image: "",
    isRecurring: false,
    recurringInterval: "" as 'month' | 'year' | "",
  });

  useEffect(() => {
    fetchItems();
  }, [campaignId]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("campaign_items")
      .select("*")
      .eq("campaign_id", campaignId);

    if (error) {
      console.error("Error fetching items:", error);
      return;
    }

    const itemsWithVariants = await Promise.all((data || []).map(async (item: any) => {
      let variants: SizeVariantData[] = [];
      if (item.has_variants) {
        const { data: variantsData } = await supabase
          .from("campaign_item_variants")
          .select("*")
          .eq("campaign_item_id", item.id)
          .order("display_order");
        variants = variantsData || [];
      }
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        cost: item.cost,
        quantityOffered: item.quantity_offered,
        quantityAvailable: item.quantity_available,
        maxItemsPurchased: item.max_items_purchased,
        size: item.size,
        eventStartDate: item.event_start_date,
        eventEndDate: item.event_end_date,
        image: item.image,
        isRecurring: item.is_recurring || false,
        recurringInterval: item.recurring_interval ?? undefined,
        hasVariants: item.has_variants || false,
        variants,
      };
    }));

    setItems(itemsWithVariants);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      cost: "",
      quantityOffered: "",
      quantityAvailable: "",
      maxItemsPurchased: "",
      size: "",
      eventStartDate: "",
      eventEndDate: "",
      image: "",
      isRecurring: false,
      recurringInterval: "",
    });
    setEditingItem(null);
    setImageFile(null);
    setHasVariants(false);
    setSizeVariants([]);
  };

  const handleCancel = () => {
    resetForm();
    setIsFormVisible(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsFormVisible(true);
  };

  const editItem = (item: CampaignItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      cost: item.cost.toString(),
      quantityOffered: item.quantityOffered.toString(),
      quantityAvailable: item.quantityAvailable.toString(),
      maxItemsPurchased: item.maxItemsPurchased?.toString() || "",
      size: item.size || "",
      eventStartDate: item.eventStartDate || "",
      eventEndDate: item.eventEndDate || "",
      image: item.image || "",
      isRecurring: item.isRecurring || false,
      recurringInterval: item.recurringInterval || "",
    });
    setHasVariants(item.hasVariants || false);
    setSizeVariants(item.variants || []);
    setIsFormVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.cost || !formData.quantityOffered || !formData.quantityAvailable) {
      toast({
        title: "Missing required fields",
        description: "Please fill in name, cost, quantity offered, and quantity available",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = formData.image;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('campaign-item-images')
          .upload(fileName, imageFile);

        if (!uploadError) {
          const { data } = supabase.storage
            .from('campaign-item-images')
            .getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        }
      }

      let quantityOffered = parseInt(formData.quantityOffered) || 0;
      let quantityAvailable = parseInt(formData.quantityAvailable) || 0;

      if (hasVariants && sizeVariants.length > 0) {
        quantityOffered = sizeVariants.reduce((sum, v) => sum + v.quantity_offered, 0);
        quantityAvailable = sizeVariants.reduce((sum, v) => sum + v.quantity_available, 0);
      }

      const itemData = {
        name: formData.name,
        description: formData.description || null,
        cost: parseFloat(formData.cost),
        quantity_offered: quantityOffered,
        quantity_available: quantityAvailable,
        max_items_purchased: formData.maxItemsPurchased ? parseInt(formData.maxItemsPurchased) : null,
        size: hasVariants ? null : (formData.size || null),
        event_start_date: formData.eventStartDate || null,
        event_end_date: formData.eventEndDate || null,
        image: imageUrl || null,
        is_recurring: formData.isRecurring,
        recurring_interval: formData.isRecurring && formData.recurringInterval ? formData.recurringInterval : null,
        has_variants: hasVariants,
      };

      let savedItemId: string | null = null;

      if (editingItem?.id) {
        const { error } = await supabase
          .from("campaign_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
        savedItemId = editingItem.id;

        if (hasVariants) {
          await supabase
            .from("campaign_item_variants")
            .delete()
            .eq("campaign_item_id", savedItemId);
        }

        toast({ title: "Item updated" });
      } else {
        const { data: newItem, error } = await supabase
          .from("campaign_items")
          .insert([{ ...itemData, campaign_id: campaignId }])
          .select("id")
          .single();

        if (error || !newItem) throw error;
        savedItemId = newItem.id;

        toast({ title: "Item added" });
      }

      if (hasVariants && sizeVariants.length > 0 && savedItemId) {
        await supabase
          .from("campaign_item_variants")
          .insert(sizeVariants.map((v, index) => ({
            campaign_item_id: savedItemId,
            size: v.size,
            quantity_offered: v.quantity_offered,
            quantity_available: v.quantity_available,
            display_order: index,
          })));
      }

      await fetchItems();
      resetForm();
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error saving item:", error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from("campaign_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
      return;
    }

    await fetchItems();
    toast({ title: "Item deleted" });
  };

  return (
    <div className="space-y-4">
      {!isFormVisible && items.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      )}
      {isFormVisible ? (
          <div className="space-y-4">
            {/* Form Header */}
            <div className="flex items-center justify-between p-4 -mx-6 -mt-4 mb-4 bg-primary/10 border-b rounded-t-lg">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">
                    {editingItem ? `Edit: ${editingItem.name}` : "Add New Item"}
                  </h3>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Name *</Label>
                  <Input
                    placeholder="Enter item name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter item description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Inventory Management Tabs */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <Tabs 
                    value={hasVariants ? "variants" : "single"} 
                    onValueChange={(v) => setHasVariants(v === "variants")}
                    className="w-full"
                  >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single">Single Offering</TabsTrigger>
                  <TabsTrigger value="variants">Size Variants</TabsTrigger>
                </TabsList>
                
                <TabsContent value="single" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>Qty Offered *</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Total inventory available to sell</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.quantityOffered}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            quantityOffered: val,
                            quantityAvailable: !editingItem ? val : prev.quantityAvailable,
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>Qty Available *</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">Current stock remaining</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.quantityAvailable}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantityAvailable: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Size (optional)</Label>
                    <Input
                      placeholder="e.g. One Size, Large"
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="variants" className="pt-4">
                  <SizeVariantsEditor variants={sizeVariants} onChange={setSizeVariants} />
                </TabsContent>
                </Tabs>
                </div>

              {/* Recurring */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Recurring Payment</Label>
                    <p className="text-sm text-muted-foreground">Charge periodically</p>
                  </div>
                  <Switch
                    checked={formData.isRecurring}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isRecurring: v }))}
                  />
                </div>
                {formData.isRecurring && (
                  <Select
                    value={formData.recurringInterval}
                    onValueChange={(v: 'month' | 'year') => setFormData(prev => ({ ...prev, recurringInterval: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Max per Order */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label>Max per Order</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Limit how many a single buyer can purchase to prevent someone from buying out your entire supply</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={formData.maxItemsPurchased}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxItemsPurchased: e.target.value }))}
                  className="max-w-[200px]"
                />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label>Item Image</Label>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => document.getElementById('item-image-upload')?.click()}
                >
                  <Input
                    id="item-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-muted-foreground">
                    {imageFile ? imageFile.name : formData.image ? "Click to replace image" : "Click to upload"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>${item.cost.toFixed(2)}</TableCell>
                      <TableCell>
                        {item.isRecurring ? (
                          <Badge variant="secondary">
                            {item.recurringInterval === 'month' ? 'Monthly' : 'Annual'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">One-time</span>
                        )}
                      </TableCell>
                      <TableCell>{item.quantityAvailable} / {item.quantityOffered}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => editItem(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => item.id && deleteItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">No items added yet</p>
                <Button variant="outline" onClick={handleAddNew} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Item
                </Button>
              </div>
            )}
          </>
        )}
    </div>
  );
}
