import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText, LayoutTemplate, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function LandingPages() {
  const [isGeneratingSlugs, setIsGeneratingSlugs] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["landing-page-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ["landing-page-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_configs")
        .select("*, template:landing_page_templates(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["landing-page-stats"],
    queryFn: async () => {
      const [templatesRes, configsRes, publishedRes] = await Promise.all([
        supabase.from("landing_page_templates").select("id", { count: "exact", head: true }),
        supabase.from("landing_page_configs").select("id", { count: "exact", head: true }),
        supabase.from("landing_page_configs").select("id", { count: "exact", head: true }).eq("is_published", true),
      ]);
      return {
        templates: templatesRes.count || 0,
        configs: configsRes.count || 0,
        published: publishedRes.count || 0,
      };
    },
  });

  const handleGenerateSlugs = async (entityType: string) => {
    setIsGeneratingSlugs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("generate-landing-page-slugs", {
        body: { entityType },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate slugs");
    } finally {
      setIsGeneratingSlugs(false);
    }
  };

  return (
    <SystemAdminPageLayout title="Landing Pages" subtitle="Manage dynamic landing page templates for schools and districts">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Landing Pages</h1>
            <p className="text-muted-foreground">Create and manage dynamic landing pages for schools and districts</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.templates || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Configured Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.configs || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.published || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="templates">
          <TabsList>
            <TabsTrigger value="templates">
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="pages">
              <FileText className="mr-2 h-4 w-4" />
              Configured Pages
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Page Templates</CardTitle>
                <CardDescription>Reusable templates for school and district landing pages</CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <p className="text-muted-foreground">Loading templates...</p>
                ) : templates?.length === 0 ? (
                  <p className="text-muted-foreground">No templates created yet. Click "New Template" to get started.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates?.map((template: any) => (
                      <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant="secondary">{template.template_type}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.description || "No description"}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Configured Pages</CardTitle>
                <CardDescription>Schools and districts with custom landing pages</CardDescription>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : configs?.length === 0 ? (
                  <p className="text-muted-foreground">No pages configured yet.</p>
                ) : (
                  <p className="text-muted-foreground">{configs?.length} pages configured</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Slug Generation</CardTitle>
                <CardDescription>Generate SEO-friendly URL slugs for schools and districts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => handleGenerateSlugs("schools")} disabled={isGeneratingSlugs}>
                    Generate School Slugs
                  </Button>
                  <Button onClick={() => handleGenerateSlugs("districts")} disabled={isGeneratingSlugs}>
                    Generate District Slugs
                  </Button>
                  <Button onClick={() => handleGenerateSlugs("all")} disabled={isGeneratingSlugs} variant="outline">
                    Generate All
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  This will generate URL-friendly slugs for any schools or districts that don't have one yet.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SystemAdminPageLayout>
  );
}
