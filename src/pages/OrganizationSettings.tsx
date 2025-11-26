import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { supabase } from "@/integrations/supabase/client";
import DashboardPageLayout from "@/components/DashboardPageLayout";
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
import { Loader2, Building, Upload } from "lucide-react";

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
  const { organizationUser, loading: orgUserLoading } = useOrganizationUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [stats, setStats] = useState({ users: 0, groups: 0, campaigns: 0, revenue: 0 });

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website_url: "",
      city: "",
      state: "",
      zip: "",
      logo_url: "",
      primary_color: "",
      secondary_color: "",
    },
  });

  // Redirect non-admins
  useEffect(() => {
    if (!orgUserLoading && organizationUser?.user_type?.permission_level !== "organization_admin") {
      toast({
        title: "Access Denied",
        description: "You must be an organization admin to access settings",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [organizationUser, orgUserLoading, navigate, toast]);

  // Fetch organization data
  useEffect(() => {
    const fetchData = async () => {
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

        setOrganizationData(org);
        form.reset({
          name: org.name || "",
          email: org.email || "",
          phone: org.phone || "",
          website_url: org.website_url || "",
          city: org.city || "",
          state: org.state || "",
          zip: org.zip || "",
          logo_url: org.logo_url || "",
          primary_color: org.primary_color || "",
          secondary_color: org.secondary_color || "",
        });

        // Fetch stats
        const [usersResult, groupsResult, campaignsResult, ordersResult] = await Promise.all([
          supabase.from("organization_user").select("id", { count: "exact", head: true }).eq("organization_id", organizationUser.organization_id),
          supabase.from("groups").select("id", { count: "exact", head: true }).eq("organization_id", organizationUser.organization_id),
          supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("group_id", org.id).in("group_id", await supabase.from("groups").select("id").eq("organization_id", organizationUser.organization_id).then(r => r.data?.map(g => g.id) || [])),
          supabase.from("orders").select("total_amount").eq("organization_id", organizationUser.organization_id).eq("payment_status", "completed"),
        ]);

        setStats({
          users: usersResult.count || 0,
          groups: groupsResult.count || 0,
          campaigns: campaignsResult.count || 0,
          revenue: ordersResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
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

    fetchData();
  }, [organizationUser?.organization_id]);

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

      setIsEditing(false);

      // Refresh data
      const { data: updatedOrg } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationUser.organization_id)
        .single();

      if (updatedOrg) {
        setOrganizationData(updatedOrg);
      }
    } catch (error: any) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusBadge = () => {
    if (!organizationData) return null;

    const status = organizationData.verification_status;
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      in_review: "secondary",
      approved: "default",
      rejected: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status?.replace("_", " ").toUpperCase() || "N/A"}
      </Badge>
    );
  };

  if (orgUserLoading || !organizationUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardPageLayout
      segments={[
        { label: "Dashboard", path: "/dashboard" },
        { label: "Settings" },
      ]}
      hideGroupsFilter={true}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Organization Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your organization details and preferences
            </p>
          </div>
          {organizationData?.logo_url && (
            <img
              src={organizationData.logo_url}
              alt="Organization logo"
              className="h-16 w-auto object-contain"
            />
          )}
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="flex flex-col md:flex-row w-full md:w-auto h-auto md:h-10">
            <TabsTrigger value="general" className="w-full md:w-auto justify-start md:justify-center">
              General Information
            </TabsTrigger>
            <TabsTrigger value="branding" className="w-full md:w-auto justify-start md:justify-center">
              Branding
            </TabsTrigger>
            <TabsTrigger value="payment" className="w-full md:w-auto justify-start md:justify-center">
              Payment Setup
            </TabsTrigger>
            <TabsTrigger value="verification" className="w-full md:w-auto justify-start md:justify-center">
              Verification
            </TabsTrigger>
            <TabsTrigger value="info" className="w-full md:w-auto justify-start md:justify-center">
              Organization Info
            </TabsTrigger>
          </TabsList>

          {/* General Information Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Update your organization's basic details</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>Edit</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name *</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" disabled={!isEditing} />
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
                              <Input {...field} type="tel" disabled={!isEditing} />
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
                            <Input {...field} type="url" disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Location</h3>

                      <div className="grid md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!isEditing} />
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
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={!isEditing}
                              >
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
                                <Input {...field} disabled={!isEditing} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>Customize your organization's visual identity</CardDescription>
                  </div>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>Edit</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                          {field.value && (
                            <div className="mt-4 p-4 border rounded-lg bg-muted">
                              <p className="text-sm font-medium mb-2">Preview:</p>
                              <img src={field.value} alt="Logo preview" className="h-16 w-auto object-contain" />
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="primary_color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input {...field} placeholder="#0066cc" disabled={!isEditing} />
                              </FormControl>
                              {field.value && (
                                <div
                                  className="w-12 h-10 rounded border"
                                  style={{ backgroundColor: field.value }}
                                />
                              )}
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
                            <FormLabel>Secondary Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input {...field} placeholder="#ff6600" disabled={!isEditing} />
                              </FormControl>
                              {field.value && (
                                <div
                                  className="w-12 h-10 rounded border"
                                  style={{ backgroundColor: field.value }}
                                />
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Setup Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Setup</CardTitle>
                <CardDescription>Configure payment processing for your campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Building className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Payment Processor</h3>
                      <p className="text-sm text-muted-foreground">
                        {organizationData?.payment_processor_config?.processor === "pending"
                          ? "No payment processor configured"
                          : "Payment account active"}
                      </p>
                    </div>
                  </div>

                  {organizationData?.payment_processor_config?.processor === "pending" ? (
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Payment processing is not yet configured for your organization. Contact support
                        to set up payment processing for your campaigns.
                      </p>
                    </div>
                  ) : (
                    <Badge variant="default">Connected</Badge>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    Payment processing allows you to accept donations through your campaigns. Once
                    configured, campaigns can be published and start accepting payments.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification">
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>View your organization's verification details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Current Status</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {organizationData?.requires_verification
                        ? "Verification required before publishing campaigns"
                        : "Verification not required"}
                    </p>
                  </div>
                  {getVerificationStatusBadge()}
                </div>

                {organizationData?.verification_status === "approved" && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-sm text-green-900">
                      ✓ Your organization is verified and can publish campaigns
                    </p>
                    {organizationData?.verified_at && (
                      <p className="text-xs text-green-700 mt-1">
                        Verified on {new Date(organizationData.verified_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {organizationData?.verification_status === "pending" && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg space-y-3">
                    <p className="text-sm text-yellow-900">
                      Your verification is pending review. You can create draft campaigns but cannot
                      publish them until verification is approved.
                    </p>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Documents
                    </Button>
                  </div>
                )}

                {organizationData?.verification_status === "rejected" && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-900">
                      Your verification was not approved. Please contact support for assistance.
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
                <CardDescription>View your organization's statistics and details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Organization Type</Label>
                    <Input
                      value={organizationData?.organization_type === "school" ? "School" : "Non-Profit"}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Created Date</Label>
                    <Input
                      value={
                        organizationData?.created_at
                          ? new Date(organizationData.created_at).toLocaleDateString()
                          : "N/A"
                      }
                      disabled
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.users}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Groups
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.groups}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Campaigns
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.campaigns}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        ${stats.revenue.toLocaleString()}
                      </p>
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
