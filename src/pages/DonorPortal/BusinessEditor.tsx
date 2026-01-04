import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DonorPortalLayout } from "@/components/DonorPortal/DonorPortalLayout";
import { AvatarUpload } from "@/components/AvatarUpload";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

const businessSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  business_email: z.string().email("Invalid email").optional().or(z.literal("")),
  business_phone: z.string().optional(),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

interface BusinessData extends BusinessFormValues {
  id: string;
  logo_url: string | null;
}

export default function DonorPortalBusinessEditor() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { linkedBusinesses, isLoading: portalLoading } = useDonorPortal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      business_name: "",
      business_email: "",
      business_phone: "",
      website_url: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
    },
  });

  // Check if user has permission to edit this business (any linked donor can edit)
  const hasPermission = linkedBusinesses.some(
    (link) => link.business_id === businessId
  );

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!businessId) return;

      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single();

        if (error) throw error;

        setBusiness(data);
        setLogoUrl(data.logo_url);
        form.reset({
          business_name: data.business_name,
          business_email: data.business_email || "",
          business_phone: data.business_phone || "",
          website_url: data.website_url || "",
          address_line1: data.address_line1 || "",
          address_line2: data.address_line2 || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
        });
      } catch (error) {
        console.error('Error fetching business:', error);
        toast({
          title: "Error",
          description: "Failed to load business details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!portalLoading) {
      fetchBusiness();
    }
  }, [businessId, portalLoading, form, toast]);

  const onSubmit = async (values: BusinessFormValues) => {
    if (!businessId || !hasPermission) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          ...values,
          logo_url: logoUrl,
        })
        .eq('id', businessId);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Business information updated successfully",
      });
    } catch (error) {
      console.error('Error updating business:', error);
      toast({
        title: "Error",
        description: "Failed to update business information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || portalLoading) {
    return (
      <DonorPortalLayout title="Edit Business">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DonorPortalLayout>
    );
  }

  if (!business) {
    return (
      <DonorPortalLayout title="Edit Business">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">Business not found</h2>
          <Button asChild>
            <Link to="/portal/businesses">Back to Businesses</Link>
          </Button>
        </div>
      </DonorPortalLayout>
    );
  }

  if (!hasPermission) {
    return (
      <DonorPortalLayout title="Edit Business">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">Permission Denied</h2>
          <p className="text-muted-foreground mb-4">
            You must be linked to this business to edit its information.
          </p>
          <Button asChild>
            <Link to="/portal/businesses">Back to Businesses</Link>
          </Button>
        </div>
      </DonorPortalLayout>
    );
  }

  return (
    <DonorPortalLayout title={`Edit ${business.business_name}`}>
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/portal/businesses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Businesses
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logo Upload */}
          <Card>
          <CardHeader>
            <CardTitle>Business Logo</CardTitle>
            <CardDescription>
              Upload your company logo for sponsorship materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentAvatarUrl={logoUrl}
              onAvatarUpdate={setLogoUrl}
              userId={businessId || ''}
              userInitials={business?.business_name?.[0] || 'B'}
            />
            </CardContent>
          </Card>

          {/* Business Info Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your company details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="business_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
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
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address_line1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DonorPortalLayout>
  );
}
