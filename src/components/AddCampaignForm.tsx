import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  goalAmount: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupId: z.string().min(1, "Group is required"),
  campaignTypeId: z.string().min(1, "Campaign type is required"),
  slug: z.string().min(1, "URL slug is required"),
  imageUrl: z.string().optional(),
  requiresBusinessInfo: z.boolean().optional(),
  fileUploadDeadlineDays: z.string().optional(),
});

const campaignItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  cost: z.string().min(1, "Cost is required"),
  quantityOffered: z.string().min(1, "Quantity offered is required"),
  quantityAvailable: z.string().min(1, "Quantity available is required"),
  maxItemsPurchased: z.string().optional(),
  size: z.string().optional(),
  eventStartDate: z.string().optional(),
  eventEndDate: z.string().optional(),
  image: z.string().optional(),
});

interface AddCampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignAdded: () => void;
  editCampaign?: {
    id: string;
    name: string;
    description: string | null;
    goal_amount: number | null;
    start_date: string | null;
    end_date: string | null;
    group_id: string;
    campaign_type_id: string;
    slug: string | null;
    image_url: string | null;
    publication_status: string;
  } | null;
  manageCampaignId?: string | null;
}

interface Group {
  id: string;
  group_name: string;
}

interface CampaignType {
  id: string;
  name: string;
}

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
}

interface CustomField {
  id?: string;
  field_name: string;
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'url' | 'email' | 'phone' | 'file' | 'checkbox' | 'select';
  field_options?: string[];
  is_required: boolean;
  help_text?: string;
  display_order: number;
}

export function AddCampaignForm({ open, onOpenChange, onCampaignAdded, editCampaign, manageCampaignId }: AddCampaignFormProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [campaignItems, setCampaignItems] = useState<CampaignItem[]>([]);
  const [editingItem, setEditingItem] = useState<CampaignItem | null>(null);
  const [campaignTypeId, setCampaignTypeId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [campaignImageFile, setCampaignImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string>("");
  const [slugExists, setSlugExists] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const { organizationUser } = useOrganizationUser();
  const { toast } = useToast();

  const campaignForm = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      goalAmount: "",
      startDate: "",
      endDate: "",
      groupId: "",
      campaignTypeId: "",
      slug: "",
      imageUrl: "",
      requiresBusinessInfo: false,
      fileUploadDeadlineDays: "",
    },
  });

  const itemForm = useForm<z.infer<typeof campaignItemSchema>>({
    resolver: zodResolver(campaignItemSchema),
    defaultValues: {
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
    },
  });

  const fetchGroups = async () => {
    if (!organizationUser) return;

    try {
      let query = supabase
        .from("groups")
        .select("id, group_name, organization_id")
        .eq("status", true);

      // Filter groups based on user permission level
      const permissionLevel = organizationUser.user_type.permission_level;
      
      if (permissionLevel === 'organization_admin') {
        // Organization admins can see all groups in their organization
        query = query.eq('organization_id', organizationUser.organization_id);
      } else if (permissionLevel === 'program_manager') {
        // Program managers can only create campaigns for their groups
        if (organizationUser.group_id) {
          query = query.eq('id', organizationUser.group_id);
        } else {
          setGroups([]);
          return;
        }
      } else {
        // Other roles cannot create campaigns
        setGroups([]);
        return;
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching groups:", error);
        return;
      }

      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchCampaignTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_type")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error fetching campaign types:", error);
        return;
      }

      setCampaignTypes(data || []);
    } catch (error) {
      console.error("Error fetching campaign types:", error);
    }
  };

  const fetchCampaignItems = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from("campaign_items")
        .select("*")
        .eq("campaign_id", campaignId);

      if (error) {
        console.error("Error fetching campaign items:", error);
        return;
      }

      const formattedItems: CampaignItem[] = (data || []).map((item: any) => ({
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
      }));

      setCampaignItems(formattedItems);
    } catch (error) {
      console.error("Error fetching campaign items:", error);
    }
  };

  const fetchCampaignType = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("campaign_type_id")
        .eq("id", campaignId)
        .single();

      if (error) {
        console.error("Error fetching campaign type:", error);
        return;
      }

      setCampaignTypeId(data.campaign_type_id);
    } catch (error) {
      console.error("Error fetching campaign type:", error);
    }
  };

  const generateSlugFromName = (name: string): string => {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
  };

  const checkSlugExists = async (slug: string, excludeId?: string): Promise<boolean> => {
    if (!slug) return false;
    
    setCheckingSlug(true);
    try {
      let query = supabase
        .from("campaigns")
        .select("id")
        .eq("slug", slug);
      
      if (excludeId) {
        query = query.neq("id", excludeId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error checking slug:", error);
        return false;
      }
      
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error("Error checking slug:", error);
      return false;
    } finally {
      setCheckingSlug(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGroups();
      fetchCampaignTypes();
      
      // Handle manage campaign items mode
      if (manageCampaignId) {
        setCreatedCampaignId(manageCampaignId);
        setStep(2);
        fetchCampaignItems(manageCampaignId);
        fetchCampaignType(manageCampaignId);
      }
      // Pre-populate form if editing
      else if (editCampaign) {
        campaignForm.reset({
          name: editCampaign.name,
          description: editCampaign.description || "",
          goalAmount: editCampaign.goal_amount?.toString() || "",
          startDate: editCampaign.start_date || "",
          endDate: editCampaign.end_date || "",
          groupId: editCampaign.group_id,
          campaignTypeId: editCampaign.campaign_type_id,
          slug: editCampaign.slug || "",
          imageUrl: editCampaign.image_url || "",
        });
        setCreatedCampaignId(editCampaign.id);
        setCampaignTypeId(editCampaign.campaign_type_id);
      }
      // Pre-populate slug for new campaigns
      else {
        const name = campaignForm.watch("name");
        if (name) {
          const suggestedSlug = generateSlugFromName(name);
          campaignForm.setValue("slug", suggestedSlug);
        }
      }
    }
  }, [open, organizationUser, editCampaign, manageCampaignId]);

  const onCampaignSubmit = async (values: z.infer<typeof campaignSchema>) => {
    if (!organizationUser) return;

    setLoading(true);
    try {
      // Upload campaign image if selected
      let imageUrl = values.imageUrl;
      if (campaignImageFile) {
        try {
          const fileExt = campaignImageFile.name.split('.').pop();
          const fileName = `campaigns/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('campaign-item-images')
            .upload(fileName, campaignImageFile);

          if (uploadError) {
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('campaign-item-images')
            .getPublicUrl(fileName);

          imageUrl = publicUrl;
        } catch (uploadError) {
          console.error("Error uploading campaign image:", uploadError);
          toast({
            title: "Warning",
            description: "Campaign saved but image upload failed. You can update the image later.",
            variant: "default",
          });
        }
      }

      const campaignData = {
        name: values.name,
        description: values.description || null,
        goal_amount: values.goalAmount ? parseFloat(values.goalAmount) : null,
        start_date: values.startDate || null,
        end_date: values.endDate || null,
        group_id: values.groupId,
        campaign_type_id: values.campaignTypeId,
        slug: values.slug,
        status: true,
        publication_status: editCampaign ? undefined : 'draft', // Set draft for new campaigns only
        image_url: imageUrl || null,
      };

      if (editCampaign) {
        // Update existing campaign
        const { error } = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", editCampaign.id);

        if (error) {
          console.error("Error updating campaign:", error);
          toast({
            title: "Error",
            description: "Failed to update campaign. Please try again.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Campaign updated successfully!",
        });
        onCampaignAdded(); // Refresh the campaigns list
        handleClose();
      } else {
        // Create new campaign
        const { data, error } = await supabase
          .from("campaigns")
          .insert([campaignData])
          .select()
          .single();

        if (error) {
          console.error("Error creating campaign:", error);
          toast({
            title: "Error",
            description: "Failed to create campaign. Please try again.",
            variant: "destructive",
          });
          return;
        }

      setCreatedCampaignId(data.id);
      setCampaignTypeId(values.campaignTypeId);
      setStep(2);
        toast({
          title: "Success",
          description: "Campaign created! Now add campaign items.",
        });
      }
    } catch (error) {
      console.error("Error with campaign:", error);
      toast({
        title: "Error",
        description: "Failed to save campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('campaign-item-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('campaign-item-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const onItemSubmit = async (values: z.infer<typeof campaignItemSchema>) => {
    if (!createdCampaignId) return;

    setUploading(true);
    try {
      let imageUrl = values.image;

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const itemData = {
        name: values.name,
        description: values.description || null,
        cost: parseFloat(values.cost),
        quantity_offered: parseInt(values.quantityOffered),
        quantity_available: parseInt(values.quantityAvailable),
        max_items_purchased: values.maxItemsPurchased ? parseInt(values.maxItemsPurchased) : null,
        size: values.size || null,
        event_start_date: values.eventStartDate || null,
        event_end_date: values.eventEndDate || null,
        image: imageUrl || null,
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("campaign_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) {
          console.error("Error updating campaign item:", error);
          toast({
            title: "Error",
            description: "Failed to update campaign item. Please try again.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Campaign item updated successfully!",
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from("campaign_items")
          .insert([{ ...itemData, campaign_id: createdCampaignId }]);

        if (error) {
          console.error("Error creating campaign item:", error);
          toast({
            title: "Error",
            description: "Failed to add campaign item. Please try again.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success",
          description: "Campaign item added successfully!",
        });
      }

      // Refresh items list, clear form, and reset editing state
      await fetchCampaignItems(createdCampaignId);
      itemForm.reset({
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
      });
      setEditingItem(null);
      setImageFile(null);
    } catch (error) {
      console.error("Error with campaign item:", error);
      toast({
        title: "Error",
        description: "Failed to save campaign item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const editCampaignItem = (item: CampaignItem) => {
    setEditingItem(item);
    setImageFile(null);
    setAccordionValue("add-item"); // Expand accordion when editing
    itemForm.reset({
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
    });
  };

  const removeCampaignItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("campaign_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.error("Error deleting campaign item:", error);
        toast({
          title: "Error",
          description: "Failed to remove campaign item. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (createdCampaignId) {
        await fetchCampaignItems(createdCampaignId);
      }
      toast({
        title: "Success",
        description: "Campaign item removed successfully!",
      });
    } catch (error) {
      console.error("Error deleting campaign item:", error);
      toast({
        title: "Error",
        description: "Failed to remove campaign item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setStep(1);
    setCreatedCampaignId(null);
    setCampaignItems([]);
    setEditingItem(null);
    setCampaignTypeId("");
    setImageFile(null);
    setCampaignImageFile(null);
    campaignForm.reset();
    itemForm.reset();
    onOpenChange(false);
    if (step === 2) {
      onCampaignAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? (editCampaign ? "Edit Campaign" : "Add New Campaign") : (manageCampaignId ? "Manage Campaign Items" : "Add Campaign Items")}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? (editCampaign ? "Edit your campaign details." : "Create a new fundraising campaign for your group.")
              : (manageCampaignId ? "Manage items for your campaign. You can add, edit, or remove items as needed." : "Add items to your campaign. You can add multiple items and remove them as needed.")
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <Form {...campaignForm}>
            <form onSubmit={campaignForm.handleSubmit(onCampaignSubmit)} className="space-y-4">
              <FormField
                control={campaignForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter campaign name" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Auto-generate slug for new campaigns only
                          if (!editCampaign) {
                            const suggestedSlug = generateSlugFromName(e.target.value);
                            campaignForm.setValue("slug", suggestedSlug);
                            // Check if the generated slug exists
                            if (suggestedSlug) {
                              checkSlugExists(suggestedSlug).then(setSlugExists);
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={campaignForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="campaign-url-slug" 
                        className={slugExists ? "border-destructive" : ""}
                        {...field}
                        onChange={async (e) => {
                          field.onChange(e);
                          const slug = e.target.value;
                          if (slug) {
                            const exists = await checkSlugExists(slug, editCampaign?.id);
                            setSlugExists(exists);
                          } else {
                            setSlugExists(false);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">
                      Must be unique. This is the unique URL of your campaign landing page.
                      {checkingSlug && <span className="ml-2">Checking...</span>}
                      {slugExists && <span className="ml-2 text-destructive">This slug is already taken</span>}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={campaignForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter campaign description" 
                        className="resize-none"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campaign Image Upload Field */}
              <FormField
                control={campaignForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Image</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {field.value && !campaignImageFile && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Current: {field.value.split('/').pop()}</span>
                            <Button 
                              type="button" 
                              variant="link" 
                              size="sm" 
                              className="h-auto p-0"
                              onClick={() => document.getElementById('campaign-image-upload')?.click()}
                            >
                              Replace
                            </Button>
                          </div>
                        )}
                        <div 
                          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                          onClick={() => document.getElementById('campaign-image-upload')?.click()}
                        >
                          <Input
                            id="campaign-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCampaignImageFile(file);
                              }
                            }}
                          />
                          <div className="space-y-2">
                            <div className="text-muted-foreground">
                              {campaignImageFile ? (
                                <span>Selected: {campaignImageFile.name}</span>
                              ) : field.value && !campaignImageFile ? (
                                <span>Click to replace image</span>
                              ) : (
                                <span>Click to upload an image or drag and drop</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              This image will be displayed on your campaign landing page. PNG, JPG, JPEG up to 10MB
                            </div>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(() => {
                // Check if user should see group dropdown
                const shouldShowGroupDropdown = !organizationUser || 
                  groups.length !== 1 || 
                  organizationUser.user_type?.permission_level !== 'program_manager';

                // Auto-set group value if user only has one group and shouldn't see dropdown
                if (!shouldShowGroupDropdown && groups.length === 1 && !campaignForm.getValues('groupId')) {
                  campaignForm.setValue('groupId', groups[0].id);
                }

                if (shouldShowGroupDropdown) {
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={campaignForm.control}
                          name="groupId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Group *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select group" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {groups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                      {group.group_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={campaignForm.control}
                          name="campaignTypeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign Type *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {campaignTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={campaignForm.control}
                        name="goalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Goal Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00"
                                  className="pl-7"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  );
                } else {
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={campaignForm.control}
                        name="campaignTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campaign Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {campaignTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={campaignForm.control}
                        name="goalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Goal Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00"
                                  className="pl-7"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                }
              })()}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={campaignForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={campaignForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || slugExists || checkingSlug}>
                  {loading ? (editCampaign ? "Updating..." : "Creating...") : (editCampaign ? "Update Campaign" : "Next: Add Items")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            {/* Existing Campaign Items */}
            {campaignItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Campaign Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>${item.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editCampaignItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {manageCampaignId && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => item.id && removeCampaignItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Add/Edit Item Accordion */}
            <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue}>
              <AccordionItem value="add-item">
                <AccordionTrigger>
                  {editingItem ? "Edit Campaign Item" : "Add Campaign Item"}
                </AccordionTrigger>
                <AccordionContent>
                  <Form {...itemForm}>
                    <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4 border rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={itemForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter item name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={itemForm.control}
                          name="cost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cost *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={itemForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter item description" 
                                className="resize-none"
                                rows={2}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={itemForm.control}
                          name="quantityOffered"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity Offered *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={itemForm.control}
                          name="quantityAvailable"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity Available *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={itemForm.control}
                          name="maxItemsPurchased"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Items per Purchase</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="No limit" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Image Upload Field */}
                      <FormField
                        control={itemForm.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Image</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {field.value && !imageFile && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>Current: {field.value.split('/').pop()}</span>
                                    <Button 
                                      type="button" 
                                      variant="link" 
                                      size="sm" 
                                      className="h-auto p-0"
                                      onClick={() => document.getElementById('image-upload')?.click()}
                                    >
                                      Replace
                                    </Button>
                                  </div>
                                )}
                                <div 
                                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                                  onClick={() => document.getElementById('image-upload')?.click()}
                                >
                                  <Input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setImageFile(file);
                                      }
                                    }}
                                  />
                                  <div className="space-y-2">
                                    <div className="text-muted-foreground">
                                      {imageFile ? (
                                        <span>Selected: {imageFile.name}</span>
                                      ) : field.value && !imageFile ? (
                                        <span>Click to replace image</span>
                                      ) : (
                                        <span>Click to upload an image or drag and drop</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      PNG, JPG, JPEG up to 10MB
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Conditional fields based on campaign type */}
                      {(() => {
                        // Find the campaign type name
                        const currentCampaignType = campaignTypes.find(type => type.id === campaignTypeId);
                        const campaignTypeName = currentCampaignType?.name;

                        return (
                          <div className="grid grid-cols-3 gap-4">
                            {/* Size field - only show for Merchandise Sales */}
                            {campaignTypeName === "Merchandise Sale" && (
                              <FormField
                                control={itemForm.control}
                                name="size"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Size</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. Small, Medium, Large" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* Event dates - only show for Events */}
                            {campaignTypeName === "Event" && (
                              <>
                                <FormField
                                  control={itemForm.control}
                                  name="eventStartDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Event Start Date</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={itemForm.control}
                                  name="eventEndDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Event End Date</FormLabel>
                                      <FormControl>
                                        <Input type="date" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => {
                          itemForm.reset();
                          setEditingItem(null);
                          setAccordionValue("");
                        }}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={uploading}>
                          {uploading ? "Saving..." : (editingItem ? "Update Item" : "Add Item")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Finish
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}