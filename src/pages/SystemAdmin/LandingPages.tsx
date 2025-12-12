import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutTemplate, Settings, Loader2, School } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
import { LandingPageBlock } from "@/components/LandingPageEditor/types";
import { TemplateCard } from "@/components/LandingPageEditor/TemplateCard";
import { TemplateEditorDialog } from "@/components/LandingPageEditor/TemplateEditorDialog";
import { CreateTemplateDialog } from "@/components/LandingPageEditor/CreateTemplateDialog";
import { SchoolDistrictBrowser } from "@/components/LandingPageEditor/SchoolDistrictBrowser";
import { ConfiguredPagesList } from "@/components/LandingPageEditor/ConfiguredPagesList";
import { PageConfigDialog } from "@/components/LandingPageEditor/PageConfigDialog";

export default function LandingPages() {
  const queryClient = useQueryClient();
  const [isGeneratingSlugs, setIsGeneratingSlugs] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    name: string;
    description: string | null;
    template_type: 'school' | 'district' | 'nonprofit';
    blocks: LandingPageBlock[];
    is_default: boolean;
  } | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    name: string;
    type: 'school' | 'district';
    city?: string;
    state?: string;
    slug?: string;
    hasConfig: boolean;
    configId?: string;
  } | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
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

  // Note: Individual configs are now fetched by ConfiguredPagesList component

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

  const handleCreateTemplate = async (data: {
    name: string;
    templateType: 'school' | 'district' | 'nonprofit';
    blocks: LandingPageBlock[];
    sourceType: 'blank' | 'preset' | 'duplicate';
  }) => {
    try {
      const { error } = await supabase.from("landing_page_templates").insert({
        name: data.name,
        template_type: data.templateType,
        blocks: JSON.parse(JSON.stringify(data.blocks)),
      });

      if (error) throw error;

      toast.success("Template created successfully");
      setCreateDialogOpen(false);
      refetchTemplates();

      // Open editor for the new template
      const { data: newTemplates } = await supabase
        .from("landing_page_templates")
        .select("*")
        .eq("name", data.name)
        .order("created_at", { ascending: false })
        .limit(1);

      if (newTemplates && newTemplates[0]) {
        setSelectedTemplate({
          id: newTemplates[0].id,
          name: newTemplates[0].name,
          description: newTemplates[0].description,
          template_type: newTemplates[0].template_type as 'school' | 'district' | 'nonprofit',
          blocks: newTemplates[0].blocks as unknown as LandingPageBlock[],
          is_default: newTemplates[0].is_default || false,
        });
        setEditorDialogOpen(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create template");
    }
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate({
      id: template.id,
      name: template.name,
      description: template.description,
      template_type: template.template_type as 'school' | 'district' | 'nonprofit',
      blocks: template.blocks as unknown as LandingPageBlock[],
      is_default: template.is_default || false,
    });
    setEditorDialogOpen(true);
  };

  const handleDuplicateTemplate = async (template: any) => {
    try {
      const { error } = await supabase.from("landing_page_templates").insert({
        name: `${template.name} (Copy)`,
        description: template.description,
        template_type: template.template_type,
        blocks: JSON.parse(JSON.stringify(template.blocks)),
      });

      if (error) throw error;
      toast.success("Template duplicated successfully");
      refetchTemplates();
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate template");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("landing_page_templates")
        .delete()
        .eq("id", templateToDelete);

      if (error) throw error;
      toast.success("Template deleted successfully");
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      refetchTemplates();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (templateId: string, templateType: string) => {
    try {
      // First, unset any existing defaults for this type
      await supabase
        .from("landing_page_templates")
        .update({ is_default: false })
        .eq("template_type", templateType);

      // Set new default
      const { error } = await supabase
        .from("landing_page_templates")
        .update({ is_default: true })
        .eq("id", templateId);

      if (error) throw error;
      toast.success("Default template updated");
      refetchTemplates();
    } catch (error: any) {
      toast.error(error.message || "Failed to set default");
    }
  };

  const existingTemplates = templates?.map(t => ({
    id: t.id,
    name: t.name,
    blocks: t.blocks as unknown as LandingPageBlock[],
  })) || [];

  return (
    <SystemAdminPageLayout title="Landing Pages" subtitle="Manage dynamic landing page templates for schools and districts">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setCreateDialogOpen(true)}>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="templates">
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="pages">
              <School className="mr-2 h-4 w-4" />
              Configured Pages
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : templates?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                  <p className="text-muted-foreground mb-4">Get started by creating your first template</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template: any) => (
                  <TemplateCard
                    key={template.id}
                    id={template.id}
                    name={template.name}
                    description={template.description}
                    templateType={template.template_type}
                    blocks={template.blocks as unknown as LandingPageBlock[]}
                    isDefault={template.is_default || false}
                    createdAt={template.created_at}
                    updatedAt={template.updated_at}
                    onEdit={() => handleEditTemplate(template)}
                    onDuplicate={() => handleDuplicateTemplate(template)}
                    onDelete={() => {
                      setTemplateToDelete(template.id);
                      setDeleteDialogOpen(true);
                    }}
                    onSetDefault={() => handleSetDefault(template.id, template.template_type)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pages" className="mt-4 space-y-6">
            {/* School/District Browser */}
            <SchoolDistrictBrowser
              onConfigurePage={(entity) => {
                setSelectedEntity({
                  ...entity,
                  configId: undefined,
                });
                setConfigDialogOpen(true);
              }}
            />

            {/* Configured Pages List */}
            <ConfiguredPagesList
              onEditPage={(config) => {
                setSelectedEntity({
                  id: config.entityId,
                  name: config.entityName,
                  type: config.entityType as 'school' | 'district',
                  slug: config.slug,
                  hasConfig: true,
                  configId: config.id,
                });
                setConfigDialogOpen(true);
              }}
              onPreviewPage={(entityType, slug) => {
                const previewUrl = entityType === 'school' 
                  ? `/schools/${slug}`
                  : `/districts/${slug}`;
                window.open(previewUrl, '_blank');
              }}
            />
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
                    {isGeneratingSlugs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
      </div>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateTemplate={handleCreateTemplate}
        existingTemplates={existingTemplates}
      />

      {/* Template Editor Dialog */}
      {selectedTemplate && (
        <TemplateEditorDialog
          open={editorDialogOpen}
          onOpenChange={(open) => {
            setEditorDialogOpen(open);
            if (!open) setSelectedTemplate(null);
          }}
          templateId={selectedTemplate.id}
          templateType={selectedTemplate.template_type}
          initialData={{
            name: selectedTemplate.name,
            description: selectedTemplate.description,
            blocks: selectedTemplate.blocks,
          }}
          onSave={() => {
            refetchTemplates();
            queryClient.invalidateQueries({ queryKey: ["landing-page-stats"] });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page Configuration Dialog */}
      {selectedEntity && (
        <PageConfigDialog
          open={configDialogOpen}
          onOpenChange={(open) => {
            setConfigDialogOpen(open);
            if (!open) setSelectedEntity(null);
          }}
          entityType={selectedEntity.type}
          entity={{
            id: selectedEntity.id,
            name: selectedEntity.name,
            city: selectedEntity.city,
            state: selectedEntity.state,
            slug: selectedEntity.slug,
          }}
          existingConfigId={selectedEntity.configId}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["landing-page-configs"] });
            queryClient.invalidateQueries({ queryKey: ["landing-page-stats"] });
          }}
        />
      )}
    </SystemAdminPageLayout>
  );
}
