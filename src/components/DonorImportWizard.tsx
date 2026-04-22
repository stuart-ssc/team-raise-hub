import { useState, useEffect } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Download,
  ListPlus
} from "lucide-react";

interface DonorImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  csvField: string;
  donorField: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; email: string; error: string }>;
  importedDonorIds?: string[];
}

interface DonorList {
  id: string;
  name: string;
  description: string | null;
}

const DONOR_FIELDS = [
  { value: "email", label: "Email (Required)", required: true },
  { value: "first_name", label: "First Name", required: false },
  { value: "last_name", label: "Last Name", required: false },
  { value: "phone", label: "Phone", required: false },
  { value: "notes", label: "Notes", required: false },
  { value: "preferred_communication", label: "Preferred Communication", required: false },
];

const DonorImportWizard = ({ open, onOpenChange, onImportComplete }: DonorImportWizardProps) => {
  const { organizationUser } = useOrganizationUser();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // List selection state
  const [donorLists, setDonorLists] = useState<DonorList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");

  // Fetch existing lists when dialog opens
  useEffect(() => {
    if (open && organizationUser?.organization_id) {
      supabase
        .from("donor_lists")
        .select("id, name, description")
        .eq("organization_id", organizationUser.organization_id)
        .order("name")
        .then(({ data }) => {
          if (data) setDonorLists(data);
        });
    }
  }, [open, organizationUser?.organization_id]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        const headers = results.meta.fields || [];
        
        if (data.length === 0) {
          toast({
            title: "Empty File",
            description: "The CSV file contains no data",
            variant: "destructive",
          });
          return;
        }

        setCsvData(data);
        setCsvHeaders(headers);
        
        // Auto-map fields based on common naming
        const autoMappings: FieldMapping[] = headers.map(header => {
          const normalizedHeader = header.toLowerCase().trim();
          let donorField = "";
          
          if (normalizedHeader.includes("email")) donorField = "email";
          else if (normalizedHeader.includes("first") && normalizedHeader.includes("name")) donorField = "first_name";
          else if (normalizedHeader.includes("last") && normalizedHeader.includes("name")) donorField = "last_name";
          else if (normalizedHeader.includes("phone")) donorField = "phone";
          else if (normalizedHeader.includes("note")) donorField = "notes";
          else if (normalizedHeader.includes("communication")) donorField = "preferred_communication";
          
          return { csvField: header, donorField };
        });
        
        setFieldMappings(autoMappings);
        setStep(2);
        
        toast({
          title: "File Uploaded",
          description: `${data.length} rows loaded successfully`,
        });
      },
      error: (error) => {
        toast({
          title: "Parse Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const updateFieldMapping = (csvField: string, donorField: string) => {
    setFieldMappings(prev =>
      prev.map(mapping =>
        mapping.csvField === csvField
          ? { ...mapping, donorField }
          : mapping
      )
    );
  };

  const validateMappings = (): boolean => {
    const emailMapping = fieldMappings.find(m => m.donorField === "email");
    if (!emailMapping) {
      toast({
        title: "Email Required",
        description: "You must map a CSV column to the Email field",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const getPreviewData = () => {
    return csvData.slice(0, 5).map(row => {
      const mappedRow: any = {};
      fieldMappings.forEach(mapping => {
        if (mapping.donorField) {
          mappedRow[mapping.donorField] = row[mapping.csvField];
        }
      });
      return mappedRow;
    });
  };

  const handleImport = async () => {
    if (!organizationUser?.organization_id) return;

    setImporting(true);
    try {
      // Transform CSV data according to mappings
      const donors = csvData.map(row => {
        const donor: any = {};
        fieldMappings.forEach(mapping => {
          if (mapping.donorField && row[mapping.csvField]) {
            donor[mapping.donorField] = row[mapping.csvField].trim();
          }
        });
        return donor;
      });

      const { data, error } = await supabase.functions.invoke("import-donors", {
        body: {
          organizationId: organizationUser.organization_id,
          donors,
          updateExisting,
        },
      });

      if (error) throw error;

      const importData = data as ImportResult;

      // Handle list assignment if selected
      if (importData.importedDonorIds && importData.importedDonorIds.length > 0) {
        let listId = selectedListId;

        // Create new list if requested
        if (selectedListId === "__new__" && newListName.trim()) {
          const { data: newList, error: listError } = await supabase
            .from("donor_lists")
            .insert({
              organization_id: organizationUser.organization_id,
              name: newListName.trim(),
              description: newListDescription.trim() || null,
              created_by: user?.id,
            })
            .select("id")
            .single();

          if (listError) {
            console.error("Error creating list:", listError);
            toast({ title: "List creation failed", description: listError.message, variant: "destructive" });
          } else {
            listId = newList.id;
          }
        }

        // Add donors to the list
        if (listId && listId !== "__new__" && listId !== "none") {
          const members = importData.importedDonorIds.map(donorId => ({
            list_id: listId,
            donor_id: donorId,
            added_by: user?.id,
          }));

          const { error: memberError } = await supabase
            .from("donor_list_members")
            .upsert(members, { onConflict: "list_id,donor_id" });

          if (memberError) {
            console.error("Error adding donors to list:", memberError);
            toast({ title: "List assignment failed", description: memberError.message, variant: "destructive" });
          }
        }
      }

      setImportResult(importData);
      setStep(4);

      if (importData.errors.length === 0) {
        toast({
          title: "Import Successful",
          description: `${importData.imported} donors imported, ${importData.updated} updated`,
        });
        onImportComplete();
      } else {
        toast({
          title: "Import Completed with Errors",
          description: `${importData.imported + importData.updated} successful, ${importData.errors.length} errors`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import donors",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMappings([]);
    setUpdateExisting(false);
    setImportResult(null);
    setSelectedListId("");
    setNewListName("");
    setNewListDescription("");
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = "email,first_name,last_name,phone,notes,preferred_communication\njohn@example.com,John,Doe,555-0100,Great donor,email\njane@example.com,Jane,Smith,555-0200,Regular supporter,phone";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donor_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Donors from CSV</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {
              step === 1 ? "Upload File" :
              step === 2 ? "Map Fields" :
              step === 3 ? "Preview & Confirm" :
              "Import Results"
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Upload a CSV file with donor information. The file should include at least an email column.
                  Donors you upload will be added to your supporters and shared with your organization's staff.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-upload">Select CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                </div>

                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Map Fields */}
          {step === 2 && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Map your CSV columns to donor fields. Email is required.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {csvHeaders.map((header) => {
                  const mapping = fieldMappings.find(m => m.csvField === header);
                  return (
                    <div key={header} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{header}</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sample: {csvData[0]?.[header] || "N/A"}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Select
                          value={mapping?.donorField || ""}
                          onValueChange={(value) => updateFieldMapping(header, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Skip this field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Skip this field</SelectItem>
                            {DONOR_FIELDS.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-existing"
                  checked={updateExisting}
                  onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                />
                <Label htmlFor="update-existing" className="text-sm cursor-pointer">
                  Update existing donors if email matches
                </Label>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Review the first 5 rows before importing {csvData.length} total donors.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {DONOR_FIELDS.filter(f => 
                          fieldMappings.some(m => m.donorField === f.value)
                        ).map(field => (
                          <th key={field.value} className="px-4 py-2 text-left font-medium">
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getPreviewData().map((row, idx) => (
                        <tr key={idx} className="border-t">
                          {DONOR_FIELDS.filter(f => 
                            fieldMappings.some(m => m.donorField === f.value)
                          ).map(field => (
                            <td key={field.value} className="px-4 py-2">
                              {row[field.value] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ListPlus className="h-4 w-4" />
                  <Label className="font-medium">Add to List (Optional)</Label>
                </div>
                <Select value={selectedListId} onValueChange={setSelectedListId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No list — just import" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No list — just import</SelectItem>
                    {donorLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">+ Create New List</SelectItem>
                  </SelectContent>
                </Select>

                {selectedListId === "__new__" && (
                  <div className="space-y-2 rounded-lg border p-3">
                    <div>
                      <Label htmlFor="new-list-name">List Name</Label>
                      <Input
                        id="new-list-name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="e.g. Spring Gala Invites"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-list-desc">Description (optional)</Label>
                      <Textarea
                        id="new-list-desc"
                        value={newListDescription}
                        onChange={(e) => setNewListDescription(e.target.value)}
                        placeholder="Family members to invite for the spring campaign"
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">Ready to import</p>
                  <p className="text-sm text-muted-foreground">
                    {csvData.length} donors • {updateExisting ? "Will update existing" : "Skip existing"}
                    {selectedListId && selectedListId !== "none" && (
                      <> • Adding to {selectedListId === "__new__" ? `"${newListName}"` : donorLists.find(l => l.id === selectedListId)?.name}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && importResult && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Import completed successfully
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950">
                  <p className="text-sm text-muted-foreground">Imported</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {importResult.imported}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950">
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {importResult.updated}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950">
                  <p className="text-sm text-muted-foreground">Skipped</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {importResult.skipped}
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-destructive">Errors ({importResult.errors.length})</Label>
                  <ScrollArea className="h-48 rounded-lg border p-4">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="mb-2 text-sm">
                        <Badge variant="destructive" className="mr-2">Row {error.row}</Badge>
                        <span className="font-medium">{error.email}</span>
                        <p className="text-muted-foreground ml-16">{error.error}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {step > 1 && step < 4 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {step < 3 && (
              <Button
                onClick={() => {
                  if (step === 2 && !validateMappings()) return;
                  setStep(step + 1);
                }}
                disabled={step === 1 || (step === 2 && csvHeaders.length === 0)}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {step === 3 && (
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Import
                  </>
                )}
              </Button>
            )}
            
            {step === 4 && (
              <Button onClick={handleClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonorImportWizard;
