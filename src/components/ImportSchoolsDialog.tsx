import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Download
} from "lucide-react";

interface ImportSchoolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  csvField: string;
  schoolField: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; school_name: string; error: string }>;
}

const SCHOOL_FIELDS = [
  { value: "school_name", label: "School Name (Required)", required: true },
  { value: "school_district", label: "District Name", required: false },
  { value: "county", label: "County", required: false },
  { value: "street_address", label: "Street Address", required: false },
  { value: "city", label: "City", required: false },
  { value: "state", label: "State", required: false },
  { value: "zipcode", label: "ZIP Code", required: false },
  { value: "zipcode_4_digit", label: "ZIP+4 Extension", required: false },
  { value: "phone_number", label: "Phone Number", required: false },
];

export const ImportSchoolsDialog = ({ open, onOpenChange, onImportComplete }: ImportSchoolsDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

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
        
        // Auto-map fields based on exact header names
        const autoMappings: FieldMapping[] = headers.map(header => {
          const normalizedHeader = header.toLowerCase().trim();
          let schoolField = "";
          
          // Exact matching for your specific format
          if (normalizedHeader === "school_name") schoolField = "school_name";
          else if (normalizedHeader === "school_district") schoolField = "school_district";
          else if (normalizedHeader === "county") schoolField = "county";
          else if (normalizedHeader === "street_address") schoolField = "street_address";
          else if (normalizedHeader === "city") schoolField = "city";
          else if (normalizedHeader === "state") schoolField = "state";
          else if (normalizedHeader === "zipcode") schoolField = "zipcode";
          else if (normalizedHeader === "zipcode_4_digit") schoolField = "zipcode_4_digit";
          else if (normalizedHeader === "phone_number") schoolField = "phone_number";
          
          return { csvField: header, schoolField };
        });
        
        setFieldMappings(autoMappings);
        setStep(2);
        
        toast({
          title: "File Uploaded",
          description: `${data.length} schools loaded successfully`,
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

  const updateFieldMapping = (csvField: string, schoolField: string) => {
    setFieldMappings(prev =>
      prev.map(mapping =>
        mapping.csvField === csvField
          ? { ...mapping, schoolField: schoolField === "skip" ? "" : schoolField }
          : mapping
      )
    );
  };

  const validateMappings = (): boolean => {
    const schoolNameMapping = fieldMappings.find(m => m.schoolField === "school_name");
    if (!schoolNameMapping) {
      toast({
        title: "School Name Required",
        description: "You must map a CSV column to the School Name field",
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
        if (mapping.schoolField) {
          mappedRow[mapping.schoolField] = row[mapping.csvField];
        }
      });
      return mappedRow;
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      // Verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      // Transform CSV data according to mappings
      const schools = csvData.map(row => {
        const school: any = {};
        fieldMappings.forEach(mapping => {
          if (mapping.schoolField && row[mapping.csvField]) {
            school[mapping.schoolField] = row[mapping.csvField].trim();
          }
        });
        return school;
      });

      const { data, error } = await supabase.functions.invoke("import-schools", {
        body: {
          schools,
          updateExisting,
        },
      });

      if (error) throw error;

      setImportResult(data as ImportResult);
      setStep(4);

      if (data.errors.length === 0) {
        toast({
          title: "Import Successful",
          description: `${data.imported} schools imported, ${data.updated} updated`,
        });
        onImportComplete();
      } else {
        toast({
          title: "Import Completed with Errors",
          description: `${data.imported + data.updated} successful, ${data.errors.length} errors`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import schools",
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
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = "school_name,school_district,county,street_address,city,state,zipcode,zipcode_4_digit,phone_number\nSpringfield High School,Springfield District,Jefferson,123 Main St,Springfield,KY,40000,1234,555-0100";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "school_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Schools from CSV</DialogTitle>
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
                  Upload a CSV file with school information. The file should include at least a school name column.
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
                  Map your CSV columns to school fields. School Name is required.
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
                          value={mapping?.schoolField || "skip"}
                          onValueChange={(value) => updateFieldMapping(header, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Skip this field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">Skip this field</SelectItem>
                            {SCHOOL_FIELDS.map((field) => (
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
                  Update existing schools if name + city + state matches
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
                  Review the first 5 rows before importing {csvData.length} total schools.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {SCHOOL_FIELDS.filter(f => 
                          fieldMappings.some(m => m.schoolField === f.value)
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
                          {SCHOOL_FIELDS.filter(f => 
                            fieldMappings.some(m => m.schoolField === f.value)
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

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="font-medium">Ready to import</p>
                  <p className="text-sm text-muted-foreground">
                    {csvData.length} schools • {updateExisting ? "Will update existing" : "Skip existing"}
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
                        <span className="font-medium">{error.school_name}</span>
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
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
