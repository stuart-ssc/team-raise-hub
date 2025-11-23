import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Plus, 
  Mail, 
  Edit, 
  Trash2, 
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface ThankYouTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  is_default: boolean;
  created_at: string;
}

const templateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  body: z.string().trim().min(10, "Body must be at least 10 characters").max(5000, "Body must be less than 5000 characters"),
});

const ThankYouTemplates = () => {
  const navigate = useNavigate();
  const { organizationUser, loading: organizationUserLoading } = useOrganizationUser();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ThankYouTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ThankYouTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organizationUser?.organization_id) {
      fetchTemplates();
    }
  }, [organizationUser?.organization_id]);

  const fetchTemplates = async () => {
    if (!organizationUser?.organization_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("thank_you_templates")
        .select("*")
        .eq("organization_id", organizationUser.organization_id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: ThankYouTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        subject: "Thank you for your generous donation!",
        body: "Dear {donor_name},\n\nThank you for your generous donation of {donation_amount} to {campaign_name}. Your support makes a real difference!\n\nWe truly appreciate your commitment to our mission.\n\nWith gratitude,\n{organization_name}",
      });
    }
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      // Validate form data
      const validated = templateSchema.parse(formData);
      setFormErrors({});

      setIsSaving(true);

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from("thank_you_templates")
          .update({
            name: validated.name,
            subject: validated.subject,
            body: validated.body,
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;

        toast({
          title: "Template Updated",
          description: "Your thank you template has been updated successfully",
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from("thank_you_templates")
          .insert({
            organization_id: organizationUser!.organization_id,
            name: validated.name,
            subject: validated.subject,
            body: validated.body,
            created_by: organizationUser!.user_id,
          });

        if (error) throw error;

        toast({
          title: "Template Created",
          description: "Your thank you template has been created successfully",
        });
      }

      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(errors);
      } else {
        console.error("Error saving template:", error);
        toast({
          title: "Error",
          description: "Failed to save template",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("thank_you_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast({
        title: "Template Deleted",
        description: "The template has been deleted successfully",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      // Remove default flag from all templates
      await supabase
        .from("thank_you_templates")
        .update({ is_default: false })
        .eq("organization_id", organizationUser!.organization_id);

      // Set new default
      const { error } = await supabase
        .from("thank_you_templates")
        .update({ is_default: true })
        .eq("id", templateId);

      if (error) throw error;

      toast({
        title: "Default Template Set",
        description: "This template is now your default thank you message",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error setting default template:", error);
      toast({
        title: "Error",
        description: "Failed to set default template",
        variant: "destructive",
      });
    }
  };

  if (organizationUserLoading || loading) {
    return (
      <DashboardPageLayout segments={[{ label: "Donors", path: "/dashboard/donors" }, { label: "Templates" }]} loading={true}>
        {() => (
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
        )}
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout segments={[{ label: "Donors", path: "/dashboard/donors" }, { label: "Templates" }]}>
      {(activeGroup) => (
      <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard/donors")}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Donors
              </Button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Mail className="h-8 w-8 text-primary" />
                    Thank You Templates
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Create personalized thank you messages for donors
                  </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTemplate ? "Edit Template" : "Create New Template"}
                      </DialogTitle>
                      <DialogDescription>
                        Use placeholders like {"{donor_name}"}, {"{donation_amount}"}, {"{campaign_name}"}, and {"{organization_name}"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Template Name</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Standard Thank You"
                          maxLength={100}
                        />
                        {formErrors.name && (
                          <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium">Email Subject</label>
                        <Input
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Subject line"
                          maxLength={200}
                        />
                        {formErrors.subject && (
                          <p className="text-sm text-destructive mt-1">{formErrors.subject}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium">Email Body</label>
                        <Textarea
                          value={formData.body}
                          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                          placeholder="Email message"
                          rows={12}
                          maxLength={5000}
                        />
                        {formErrors.body && (
                          <p className="text-sm text-destructive mt-1">{formErrors.body}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.body.length}/5000 characters
                        </p>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveTemplate} disabled={isSaving}>
                          {isSaving ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.length === 0 ? (
                <Card className="md:col-span-2">
                  <CardContent className="py-12 text-center">
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No templates yet</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first thank you template to get started
                    </p>
                  </CardContent>
                </Card>
              ) : (
                templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {template.name}
                            {template.is_default && (
                              <Badge variant="default" className="bg-primary">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">{template.subject}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
                          {template.body}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!template.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(template.id)}
                            className="flex-1"
                          >
                            <Star className="mr-2 h-3 w-3" />
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
        </DashboardPageLayout>
  );
};

export default ThankYouTemplates;
