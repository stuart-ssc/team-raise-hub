import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { supabase } from "@/integrations/supabase/client";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Smartphone } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
});

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain letters")
    .regex(/[0-9]/, "Password must contain numbers"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const Profile = () => {
  const { user, updatePassword } = useAuth();
  const { organizationUser } = useOrganizationUser();
  const { toast } = useToast();
  const { isSupported: pushSupported } = usePushNotifications();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [schoolUserData, setSchoolUserData] = useState<any[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState({
    notify_campaigns: true,
    notify_donations: true,
    notify_assignments: true,
    push_notify_messages: true,
  });
  const [digestFrequency, setDigestFrequency] = useState<string>("weekly");
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const getUserInitials = () => {
    if (profileData?.first_name && profileData?.last_name) {
      return `${profileData.first_name[0]}${profileData.last_name[0]}`.toUpperCase();
    }
    return "U";
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setProfileData(profile);
        profileForm.reset({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
        });
        setNotificationPrefs({
          notify_campaigns: profile.notify_campaigns ?? true,
          notify_donations: profile.notify_donations ?? true,
          notify_assignments: profile.notify_assignments ?? true,
          push_notify_messages: profile.push_notify_messages ?? true,
        });
        setDigestFrequency(profile.email_digest_frequency || "weekly");
      }
    };

    const fetchSchoolUserData = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("organization_user")
        .select(`
          *,
          organization:organization_id(name),
          groups(group_name, group_type(name)),
          user_type(name),
          rosters(roster_year)
        `)
        .eq("user_id", user.id);

      if (data) {
        setSchoolUserData(data);
      }
    };

    fetchProfileData();
    fetchSchoolUserData();
  }, [user]);

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (updatedProfile) {
        setProfileData(updatedProfile);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setLoading(true);
    try {
      const { error } = await updatePassword(values.newPassword);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value })
        .eq("id", user.id);

      if (error) throw error;

      setNotificationPrefs((prev) => ({ ...prev, [key]: value }));

      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDigestFrequencyChange = async (value: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ email_digest_frequency: value })
        .eq("id", user.id);

      if (error) throw error;

      setDigestFrequency(value);

      toast({
        title: "Success",
        description: "Email digest preference updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update preference",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestDigest = async () => {
    if (!user || digestFrequency === "none") {
      toast({
        title: "Cannot send test",
        description: "Please enable email digests first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Temporarily update the last_digest_sent_at to force a test email
      await supabase
        .from("profiles")
        .update({ last_digest_sent_at: null })
        .eq("id", user.id);

      const { data, error } = await supabase.functions.invoke("send-notification-digest", {
        body: { frequency: digestFrequency === "weekly" ? "weekly" : "daily" },
      });

      if (error) throw error;

      toast({
        title: "Test email sent!",
        description: "Check your inbox for the digest email preview",
      });
    } catch (error: any) {
      console.error("Error sending test digest:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardPageLayout
      showBreadcrumbs={false}
      hideGroupsFilter={true}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
            
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList className="flex flex-col md:flex-row w-full md:w-auto h-auto md:h-10">
                <TabsTrigger value="personal" className="w-full md:w-auto justify-start md:justify-center">Personal Information</TabsTrigger>
                <TabsTrigger value="security" className="w-full md:w-auto justify-start md:justify-center">Security</TabsTrigger>
                <TabsTrigger value="notifications" className="w-full md:w-auto justify-start md:justify-center">Notifications</TabsTrigger>
                <TabsTrigger value="groups" className="w-full md:w-auto justify-start md:justify-center">Groups & Roles</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {user && (
                      <AvatarUpload
                        userId={user.id}
                        currentAvatarUrl={profileData?.avatar_url}
                        userInitials={getUserInitials()}
                        onAvatarUpdate={(url) => setProfileData({ ...profileData, avatar_url: url })}
                      />
                    )}

                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="first_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="last_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input value={user?.email || ""} disabled />
                          <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Organization</Label>
                          <Input value={organizationUser?.organization?.name || ""} disabled />
                        </div>

                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Input value={organizationUser?.user_type?.name || ""} disabled />
                        </div>

                        <div className="space-y-2">
                          <Label>Account Created</Label>
                          <Input 
                            value={profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : ""} 
                            disabled 
                          />
                        </div>

                        <Button type="submit" disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password to keep your account secure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-2">Password Requirements:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• At least 8 characters long</li>
                            <li>• Contains letters</li>
                            <li>• Contains numbers</li>
                          </ul>
                        </div>

                        <Button type="submit" disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Change Password
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose which notifications you want to receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="notify_campaigns" className="text-base">Campaign Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about new campaigns and when goals are reached
                        </p>
                      </div>
                      <Switch
                        id="notify_campaigns"
                        checked={notificationPrefs.notify_campaigns}
                        onCheckedChange={(checked) => handleNotificationChange("notify_campaigns", checked)}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="notify_donations" className="text-base">Donation Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about new donations and purchases on campaigns
                        </p>
                      </div>
                      <Switch
                        id="notify_donations"
                        checked={notificationPrefs.notify_donations}
                        onCheckedChange={(checked) => handleNotificationChange("notify_donations", checked)}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="notify_assignments" className="text-base">Assignment Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications when you're added to groups or rosters
                        </p>
                      </div>
                      <Switch
                        id="notify_assignments"
                        checked={notificationPrefs.notify_assignments}
                        onCheckedChange={(checked) => handleNotificationChange("notify_assignments", checked)}
                        disabled={loading}
                      />
                    </div>

                    {/* Push notification settings - only show if on mobile app */}
                    {pushSupported && (
                      <div className="border-t pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Smartphone className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">Mobile Push Notifications</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label htmlFor="push_notify_messages" className="text-base">Message Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive push notifications on your mobile device when you get new messages
                            </p>
                          </div>
                          <Switch
                            id="push_notify_messages"
                            checked={notificationPrefs.push_notify_messages}
                            onCheckedChange={(checked) => handleNotificationChange("push_notify_messages", checked)}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-6">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="email_digest" className="text-base">Email Digest</Label>
                          <p className="text-sm text-muted-foreground mb-3">
                            Receive a summary of unread notifications via email
                          </p>
                        </div>
                        <Select
                          value={digestFrequency}
                          onValueChange={handleDigestFrequencyChange}
                          disabled={loading}
                        >
                          <SelectTrigger id="email_digest" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Never</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {digestFrequency !== "none" && (
                          <Button
                            variant="outline"
                            onClick={sendTestDigest}
                            disabled={loading}
                            className="w-full mt-3"
                          >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Test Email
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        These preferences control in-app notifications. Email digests are sent automatically based on your selected frequency.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="groups">
                <Card>
                  <CardHeader>
                    <CardTitle>Groups & Roles</CardTitle>
                    <CardDescription>View your assigned groups and roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {schoolUserData.length === 0 ? (
                        <p className="text-muted-foreground">No group assignments found</p>
                      ) : (
                        schoolUserData.map((schoolUserRecord, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6">
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm text-muted-foreground">School</Label>
                                  <p className="font-medium">{schoolUserRecord.schools?.school_name}</p>
                                </div>
                                
                                <div>
                                  <Label className="text-sm text-muted-foreground">Role</Label>
                                  <p className="font-medium">{schoolUserRecord.user_type?.name}</p>
                                </div>

                                {schoolUserRecord.groups && (
                                  <>
                                    <div>
                                      <Label className="text-sm text-muted-foreground">Group</Label>
                                      <p className="font-medium">{schoolUserRecord.groups.group_name}</p>
                                    </div>

                                    <div>
                                      <Label className="text-sm text-muted-foreground">Group Type</Label>
                                      <p className="font-medium">{schoolUserRecord.groups.group_type?.name || "N/A"}</p>
                                    </div>
                                  </>
                                )}

                                {schoolUserRecord.rosters && (
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Roster Year</Label>
                                    <p className="font-medium">{schoolUserRecord.rosters.roster_year}</p>
                                  </div>
                                )}

                                <div>
                                  <Label className="text-sm text-muted-foreground">Status</Label>
                                  <div>
                                    <Badge variant={schoolUserRecord.active_user ? "default" : "secondary"}>
                                      {schoolUserRecord.active_user ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Contact your school administrator to change your role or group assignments.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
    </DashboardPageLayout>
  );
};

export default Profile;
