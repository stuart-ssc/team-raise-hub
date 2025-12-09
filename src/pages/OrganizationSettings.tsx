import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { supabase } from "@/integrations/supabase/client";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { AvatarUpload } from "@/components/AvatarUpload";
import { LogoUpload } from "@/components/LogoUpload";
import { PaymentSetupTab } from "@/components/PaymentSetupTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, FileText, Upload, CheckCircle2, XCircle, AlertCircle, Pencil } from "lucide-react";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "PR",
];

const organizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  website_url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  logo_url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

const OrganizationSettings = () => {
  const { user } = useAuth();
  const { organizationUser } = useOrganizationUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBrandingEditMode, setIsBrandingEditMode] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [stats, setStats] = useState({
    userCount: 0,
    groupCount: 0,
    campaignCount: 0,
    totalRevenue: 0,
  });

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website_url: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      logo_url: "",
      primary_color: "",
      secondary_color: "",
    },
  });

  // Check permission
  const permissionLevel = organizationUser?.user_type.permission_level;
  const isOrgAdmin = permissionLevel === 'organization_admin';

  // Redirect non-admins
  useEffect(() => {
    if (organizationUser && !isOrgAdmin) {
      navigate('/dashboard');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access organization settings",
        variant: "destructive",
      });
    }
  }, [organizationUser, isOrgAdmin, navigate, toast]);

  // Fetch organization data
  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!organizationUser?.organization_id) return;

      setLoading(true);
      try {
        // Fetch organization details
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", organizationUser.organization_id)
          .single();

        if (orgError) throw orgError;

        if (org) {
          setOrganization(org);
          form.reset({
            name: org.name || "",
            email: org.email || "",
            phone: org.phone || "",
            website_url: org.website_url || "",
            address_line1: org.address_line1 || "",
            address_line2: org.address_line2 || "",
            city: org.city || "",
            state: org.state || "",
            zip: org.zip || "",
            logo_url: org.logo_url || "",
            primary_color: org.primary_color || "",
            secondary_color: org.secondary_color || "",
          });
        }

        // Fetch stats
        const [usersData, groupsData, campaignsData, ordersData] = await Promise.all([
          supabase
            .from("organization_user")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationUser.organization_id),
          supabase
            .from("groups")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationUser.organization_id),
          supabase
            .from("campaigns")
            .select("id", { count: "exact", head: true })
            .eq("group_id", organizationUser.organization_id),
          supabase
            .from("orders")
            .select("total_amount")
            .eq("status", "completed"),
        ]);

        const revenue = ordersData.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        setStats({
          userCount: usersData.count || 0,
          groupCount: groupsData.count || 0,
          campaignCount: campaignsData.count || 0,
          totalRevenue: revenue,
        });
      } catch (error: any) {
        console.error("Error fetching organization data:", error);
        toast({
          title: "Error",
          description: "Failed to load organization data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, [organizationUser, toast]);

  const onSubmit = async (values: OrganizationFormValues) => {
    if (!organizationUser?.organization_id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: values.name,
          email: values.email || null,
          phone: values.phone || null,
          website_url: values.website_url || null,
          address_line1: values.address_line1 || null,
          address_line2: values.address_line2 || null,
          city: values.city || null,
          state: values.state || null,
          zip: values.zip || null,
          logo_url: values.logo_url || null,
          primary_color: values.primary_color || null,
          secondary_color: values.secondary_color || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizationUser.organization_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization settings updated successfully",
      });
      setIsEditMode(false);
      setIsBrandingEditMode(false);
      
      // Refresh organization data
      const { data: updatedOrg } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationUser.organization_id)
        .single();
      
      if (updatedOrg) {
        setOrganization(updatedOrg);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusBadge = () => {
    const status = organization?.verification_status;
    if (!status) return null;

    const statusConfig = {
      pending: { icon: AlertCircle, variant: "secondary" as const, label: "Pending", className: "" },
      in_review: { icon: AlertCircle, variant: "default" as const, label: "In Review", className: "" },
      approved: { icon: CheckCircle2, variant: "default" as const, label: "Approved", className: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300" },
      rejected: { icon: XCircle, variant: "destructive" as const, label: "Rejected", className: "" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (!isOrgAdmin) {
    return null;
  }

  return (
    <DashboardPageLayout
      segments={[{ label: "Settings" }]}
      showBreadcrumbs={true}
      hideGroupsFilter={true}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          {organizationUser?.organization && (
            <Badge variant="outline">
              {organizationUser.organization.organization_type === "school" ? "School" : "Non-Profit"}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          {/* Schools: 4 tabs (no Payment - that's at group level). Nonprofits: 5 tabs */}
          {organizationUser?.organization?.organization_type === 'nonprofit' ? (
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="info">Organization Info</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="info">Organization Info</TabsTrigger>
            </TabsList>
          )}

          {/* General Information Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Manage your organization's basic details</CardDescription>
                  </div>
                  {!isEditMode ? (
                    <Button onClick={() => setIsEditMode(true)}>Edit</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        setIsEditMode(false);
                        form.reset();
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" disabled={!isEditMode} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" disabled={!isEditMode} />
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
                            <Input {...field} type="url" disabled={!isEditMode} />
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
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 Main Street" disabled={!isEditMode} />
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
                            <Input {...field} placeholder="Suite 100" disabled={!isEditMode} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!isEditMode} />
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
                            <Select onValueChange={field.onChange} value={field.value} disabled={!isEditMode}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="State" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {US_STATES.map((state) => (
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

                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!isEditMode} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>Customize your organization's visual identity</CardDescription>
                  </div>
                  {!isBrandingEditMode ? (
                    <Button onClick={() => setIsBrandingEditMode(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        setIsBrandingEditMode(false);
                        form.reset({
                          ...form.getValues(),
                          logo_url: organization?.logo_url || '',
                          primary_color: organization?.primary_color || '',
                          secondary_color: organization?.secondary_color || '',
                        });
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...form}>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Organization Logo</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a logo to personalize your campaigns and emails
                    </p>
                    {isBrandingEditMode ? (
                      <LogoUpload
                        organizationId={organizationUser?.organization_id || ''}
                        currentLogoUrl={form.watch('logo_url')}
                        onLogoUpdate={(url) => form.setValue('logo_url', url || '')}
                      />
                    ) : (
                      organization?.logo_url ? (
                        <div className="h-24 w-48 rounded-lg border-2 border-border overflow-hidden bg-muted">
                          <img
                            src={organization.logo_url}
                            alt="Organization logo"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No logo uploaded</p>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Brand Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} type="color" className="w-20 h-10" disabled={!isBrandingEditMode} />
                            </FormControl>
                            <Input {...field} placeholder="#0066cc" disabled={!isBrandingEditMode} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Brand Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} type="color" className="w-20 h-10" disabled={!isBrandingEditMode} />
                            </FormControl>
                            <Input {...field} placeholder="#ff6600" disabled={!isBrandingEditMode} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Brand Color Preview</p>
                    <div className="flex gap-4">
                      <div 
                        className="w-20 h-20 rounded-md border"
                        style={{ backgroundColor: form.watch("primary_color") || "#0066cc" }}
                      />
                      <div 
                        className="w-20 h-20 rounded-md border"
                        style={{ backgroundColor: form.watch("secondary_color") || "#ff6600" }}
                      />
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Setup Tab - Only shown for nonprofits */}
          {organizationUser?.organization?.organization_type === 'nonprofit' && (
            <TabsContent value="payment">
              {organizationUser?.organization_id && (
                <PaymentSetupTab 
                  organizationId={organizationUser.organization_id}
                  organizationName={organization?.name || ""}
                />
              )}
            </TabsContent>
          )}

          {/* Verification Tab */}
          <TabsContent value="verification">
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Manage your organization's verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Current Status</p>
                    <p className="text-sm text-muted-foreground">
                      {organization?.requires_verification
                        ? "Verification required for this organization"
                        : "Verification not required"}
                    </p>
                  </div>
                  {getVerificationStatusBadge()}
                </div>

                {organization?.verification_status === "pending" && (
                  <div className="p-4 bg-muted rounded-lg space-y-4">
                    <p className="text-sm font-medium">Upload Verification Document</p>
                    <p className="text-sm text-muted-foreground">
                      Please upload your 501(c)(3) determination letter or appropriate school documentation
                    </p>
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </div>
                )}

                {organization?.verification_status === "approved" && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="font-medium">Organization Verified</p>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Your organization has been verified and can publish campaigns
                    </p>
                  </div>
                )}

                {organization?.verification_status === "rejected" && (
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <XCircle className="h-5 w-5" />
                      <p className="font-medium">Verification Rejected</p>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Please review the rejection reason and resubmit your documents
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Info Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>Read-only overview of your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Organization Type</Label>
                    <Input 
                      value={organizationUser?.organization?.organization_type === "school" ? "School" : "Non-Profit"}
                      disabled 
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Created Date</Label>
                    <Input 
                      value={organization?.created_at 
                        ? new Date(organization.created_at).toLocaleDateString()
                        : "N/A"}
                      disabled 
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.userCount}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Groups</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.groupCount}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.campaignCount}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardPageLayout>
  );
};

export default OrganizationSettings;
