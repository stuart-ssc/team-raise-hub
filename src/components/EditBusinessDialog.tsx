import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTagColor, getTagBgColor } from "@/lib/utils";
import { Loader2, X, ShieldCheck, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EditBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: {
    id: string;
    business_name: string;
    ein?: string | null;
    industry?: string | null;
    business_email?: string | null;
    business_phone?: string | null;
    website_url?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
    logo_url?: string | null;
    tags?: string[] | null;
    verification_status?: string | null;
  };
  isSystemAdmin?: boolean;
  onSuccess: () => void;
}

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Professional Services",
  "Hospitality",
  "Real Estate",
  "Construction",
  "Transportation",
  "Media & Entertainment",
  "Non-Profit",
  "Government",
  "Other",
];

const usStates = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "PR", "VI", "GU", "AS", "MP"
];

const formSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  ein: z.string().optional().refine(
    (val) => !val || /^\d{2}-\d{7}$/.test(val),
    "EIN must be in format XX-XXXXXXX"
  ),
  industry: z.string().optional(),
  business_email: z.string().email("Invalid email format").optional().or(z.literal("")),
  business_phone: z.string().optional(),
  website_url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  logo_url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export function EditBusinessDialog({
  open,
  onOpenChange,
  business,
  isSystemAdmin = false,
  onSuccess,
}: EditBusinessDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>(business.tags || []);
  const isVerified = business.verification_status === "verified";
  // Verified-business field-level lock for non-system-admins:
  // a field is locked when it already has a value. Empty fields can be filled in.
  const fieldLocked = (value: string | null | undefined) =>
    isVerified && !isSystemAdmin && value !== null && value !== undefined && String(value).trim() !== "";

  const lockedMap: Record<string, boolean> = {
    business_name: fieldLocked(business.business_name),
    ein: fieldLocked(business.ein),
    industry: fieldLocked(business.industry),
    business_email: fieldLocked(business.business_email),
    business_phone: fieldLocked(business.business_phone),
    website_url: fieldLocked(business.website_url),
    address_line1: fieldLocked(business.address_line1),
    address_line2: fieldLocked(business.address_line2),
    city: fieldLocked(business.city),
    state: fieldLocked(business.state),
    zip: fieldLocked(business.zip),
    logo_url: fieldLocked(business.logo_url),
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: business.business_name,
      ein: business.ein || "",
      industry: business.industry || "",
      business_email: business.business_email || "",
      business_phone: business.business_phone || "",
      website_url: business.website_url || "",
      address_line1: business.address_line1 || "",
      address_line2: business.address_line2 || "",
      city: business.city || "",
      state: business.state || "",
      zip: business.zip || "",
      country: business.country || "US",
      logo_url: business.logo_url || "",
      tags: business.tags || [],
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Build a partial update so we never re-submit locked, unchanged values
      // (which would trip the verified-business immutability trigger).
      const candidate: Record<string, any> = {
        business_name: data.business_name,
        ein: data.ein || null,
        industry: data.industry || null,
        business_email: data.business_email || null,
        business_phone: data.business_phone || null,
        website_url: data.website_url || null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        country: data.country || "US",
        logo_url: data.logo_url || null,
      };

      const updates: Record<string, any> = {
        tags: currentTags,
        updated_at: new Date().toISOString(),
      };

      const norm = (v: any) => (v === null || v === undefined ? "" : String(v));
      for (const [key, value] of Object.entries(candidate)) {
        const original = (business as any)[key];
        if (norm(original) !== norm(value)) {
          updates[key] = value;
        }
      }

      const { error } = await supabase
        .from("businesses")
        .update(updates)
        .eq("id", business.id);

      if (error) throw error;

      toast.success("Business updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating business:", error);
      toast.error("Failed to update business");
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (currentTags.includes(newTag.trim())) {
      toast.error("Tag already exists");
      return;
    }
    setCurrentTags([...currentTags, newTag.trim()]);
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const LockedLabel = ({ children, locked }: { children: React.ReactNode; locked: boolean }) => (
    <FormLabel className="flex items-center gap-1.5">
      {children}
      {locked && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Lock className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Locked — verified value. Contact support to change.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </FormLabel>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Business Information</DialogTitle>
          <DialogDescription>
            Update the business details below. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>

        {isVerified && !isSystemAdmin && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              This business is verified. You can fill in missing details, but
              existing values can only be changed by Sponsorly support.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <LockedLabel locked={lockedMap.business_name}>Business Name *</LockedLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter business name" disabled={lockedMap.business_name} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ein"
                render={({ field }) => (
                  <FormItem>
                    <LockedLabel locked={lockedMap.ein}>EIN</LockedLabel>
                    <FormControl>
                      <Input {...field} placeholder="XX-XXXXXXX" disabled={lockedMap.ein} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <LockedLabel locked={lockedMap.industry}>Industry</LockedLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={lockedMap.industry}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Contact Information</h3>
              
              <FormField
                control={form.control}
                name="business_email"
                render={({ field }) => (
                  <FormItem>
                    <LockedLabel locked={lockedMap.business_email}>Email</LockedLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="contact@business.com" disabled={lockedMap.business_email} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_phone"
                render={({ field }) => (
                  <FormItem>
                    <LockedLabel locked={lockedMap.business_phone}>Phone</LockedLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="(555) 123-4567" disabled={lockedMap.business_phone} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <LockedLabel locked={lockedMap.website_url}>Website</LockedLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://business.com" disabled={lockedMap.website_url} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Address</h3>
              
              <FormField
                control={form.control}
                name="address_line1"
                render={({ field }) => (
                  <FormItem>
                    <LockedLabel locked={lockedMap.address_line1}>Address Line 1</LockedLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Main Street" disabled={lockedMap.address_line1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_line2"
                render={({ field }) => (
                  <FormItem>
                    <LockedLabel locked={lockedMap.address_line2}>Address Line 2</LockedLabel>
                    <FormControl>
                      <Input {...field} placeholder="Suite 100" disabled={lockedMap.address_line2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <LockedLabel locked={lockedMap.city}>City</LockedLabel>
                      <FormControl>
                        <Input {...field} placeholder="City" disabled={lockedMap.city} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <LockedLabel locked={lockedMap.state}>State</LockedLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={lockedMap.state}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="State" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="US" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Branding */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Branding</h3>
              
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://example.com/logo.png" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Tags</h3>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {currentTags.length > 0 ? (
                    currentTags.map((tag) => (
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
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button type="button" onClick={addTag} disabled={!newTag.trim()}>
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
