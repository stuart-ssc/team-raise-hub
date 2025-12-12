import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  FileText, 
  Loader2, 
  Search, 
  Eye, 
  Pencil, 
  Trash2, 
  Globe, 
  GlobeLock,
  School,
  Building2,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";

interface ConfiguredPagesListProps {
  onEditPage: (config: {
    id: string;
    entityId: string;
    entityType: 'school' | 'district';
    entityName: string;
    templateId: string;
    templateName: string;
    seoTitle: string | null;
    seoDescription: string | null;
    isPublished: boolean;
  }) => void;
  onPreviewPage: (entityType: 'school' | 'district', slug: string) => void;
}

const ITEMS_PER_PAGE = 10;

export function ConfiguredPagesList({ onEditPage, onPreviewPage }: ConfiguredPagesListProps) {
  const queryClient = useQueryClient();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch configured pages with entity names
  const { data: configsData, isLoading, refetch } = useQuery({
    queryKey: ["landing-page-configs-list", entityTypeFilter, publishedFilter, searchQuery, currentPage],
    queryFn: async () => {
      let query = supabase
        .from("landing_page_configs")
        .select(`
          *,
          template:landing_page_templates(id, name)
        `, { count: "exact" });
      
      if (entityTypeFilter !== 'all') {
        query = query.eq("entity_type", entityTypeFilter);
      }
      
      if (publishedFilter !== 'all') {
        query = query.eq("is_published", publishedFilter === 'published');
      }
      
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query
        .order("updated_at", { ascending: false })
        .range(start, end);
      
      if (error) throw error;

      // Fetch entity names
      const configsWithNames = await Promise.all((data || []).map(async (config) => {
        let entityName = 'Unknown';
        let slug = '';
        
        if (config.entity_type === 'school') {
          const { data: school } = await supabase
            .from("schools")
            .select("school_name, slug, city, state")
            .eq("id", config.entity_id)
            .single();
          if (school) {
            entityName = school.school_name;
            slug = school.slug || '';
          }
        } else if (config.entity_type === 'district') {
          const { data: district } = await supabase
            .from("school_districts")
            .select("name, slug, state")
            .eq("id", config.entity_id)
            .single();
          if (district) {
            entityName = district.name;
            slug = district.slug || '';
          }
        }
        
        return { ...config, entityName, slug };
      }));

      // Filter by search query (client-side since we need entity names)
      let filteredConfigs = configsWithNames;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filteredConfigs = configsWithNames.filter(config => 
          config.entityName.toLowerCase().includes(lowerQuery) ||
          config.seo_title?.toLowerCase().includes(lowerQuery)
        );
      }
      
      return { data: filteredConfigs, count: count || 0 };
    },
  });

  const totalCount = configsData?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleTogglePublish = async (configId: string, currentlyPublished: boolean) => {
    try {
      const { error } = await supabase
        .from("landing_page_configs")
        .update({ 
          is_published: !currentlyPublished,
          published_at: !currentlyPublished ? new Date().toISOString() : null,
        })
        .eq("id", configId);
      
      if (error) throw error;
      toast.success(currentlyPublished ? "Page unpublished" : "Page published");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["landing-page-stats"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to update publish status");
    }
  };

  const handleDeleteConfig = async () => {
    if (!configToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("landing_page_configs")
        .delete()
        .eq("id", configToDelete);
      
      if (error) throw error;
      toast.success("Page configuration deleted");
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["landing-page-stats"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete configuration");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configured Pages
          </CardTitle>
          <CardDescription>
            Schools and districts with custom landing page configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="school">Schools</SelectItem>
                <SelectItem value="district">Districts</SelectItem>
              </SelectContent>
            </Select>

            <Select value={publishedFilter} onValueChange={(v) => { setPublishedFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : configsData?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No configured pages</h3>
              <p className="text-muted-foreground">
                {searchQuery || entityTypeFilter !== 'all' || publishedFilter !== 'all'
                  ? "No pages match your filter criteria"
                  : "Use the browser above to configure landing pages for schools and districts"}
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-2">
                {totalCount} configured {totalCount === 1 ? 'page' : 'pages'}
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>SEO Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configsData?.data.map((config: any) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {config.entity_type === 'school' ? (
                              <School className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            )}
                            {config.entityName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {config.entity_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{config.template?.name || 'Unknown'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {config.seo_title || <span className="text-muted-foreground italic">Not set</span>}
                        </TableCell>
                        <TableCell>
                          {config.is_published ? (
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                              <Globe className="h-3 w-3 mr-1" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <GlobeLock className="h-3 w-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(config.updated_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {config.slug && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onPreviewPage(config.entity_type, config.slug)}
                                title="Preview"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditPage({
                                id: config.id,
                                entityId: config.entity_id,
                                entityType: config.entity_type,
                                entityName: config.entityName,
                                templateId: config.template_id,
                                templateName: config.template?.name || '',
                                seoTitle: config.seo_title,
                                seoDescription: config.seo_description,
                                isPublished: config.is_published,
                              })}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTogglePublish(config.id, config.is_published)}
                              title={config.is_published ? "Unpublish" : "Publish"}
                            >
                              {config.is_published ? (
                                <GlobeLock className="h-4 w-4" />
                              ) : (
                                <Globe className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setConfigToDelete(config.id);
                                setDeleteDialogOpen(true);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this landing page configuration? The page will no longer be accessible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfig}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
