import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from "lucide-react";

interface CsvExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDonorIds: string[];
}

const AVAILABLE_COLUMNS = [
  { id: "email", label: "Email", required: true },
  { id: "first_name", label: "First Name", required: false },
  { id: "last_name", label: "Last Name", required: false },
  { id: "phone", label: "Phone", required: false },
  { id: "total_donations", label: "Total Donations ($)", required: false },
  { id: "donation_count", label: "Number of Donations", required: false },
  { id: "lifetime_value", label: "Lifetime Value ($)", required: false },
  { id: "engagement_score", label: "Engagement Score", required: false },
  { id: "rfm_segment", label: "RFM Segment", required: false },
  { id: "first_donation_date", label: "First Donation Date", required: false },
  { id: "last_donation_date", label: "Last Donation Date", required: false },
  { id: "tags", label: "Tags", required: false },
  { id: "preferred_communication", label: "Preferred Communication", required: false },
  { id: "notes", label: "Notes", required: false },
  { id: "created_at", label: "Created Date", required: false },
];

const CsvExportDialog = ({
  open,
  onOpenChange,
  selectedDonorIds,
}: CsvExportDialogProps) => {
  const { toast } = useToast();
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "email",
    "first_name",
    "last_name",
    "total_donations",
    "lifetime_value",
    "engagement_score",
  ]);
  const [exporting, setExporting] = useState(false);

  const toggleColumn = (columnId: string) => {
    const column = AVAILABLE_COLUMNS.find(c => c.id === columnId);
    if (column?.required) return; // Can't uncheck required columns

    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const selectAll = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map(c => c.id));
  };

  const selectDefault = () => {
    setSelectedColumns([
      "email",
      "first_name",
      "last_name",
      "total_donations",
      "lifetime_value",
      "engagement_score",
    ]);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast({
        title: "No Columns Selected",
        description: "Please select at least one column to export",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-donors-csv", {
        body: {
          donorIds: selectedDonorIds,
          columns: selectedColumns,
        },
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `donors-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${data.count} donors to CSV`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export donor data",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Donors to CSV</DialogTitle>
          <DialogDescription>
            Select columns to include in the export ({selectedDonorIds.length} {selectedDonorIds.length === 1 ? "donor" : "donors"})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={selectDefault}>
              Default Columns
            </Button>
          </div>

          <ScrollArea className="h-[300px] rounded-lg border p-4">
            <div className="space-y-3">
              {AVAILABLE_COLUMNS.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={selectedColumns.includes(column.id)}
                    onCheckedChange={() => toggleColumn(column.id)}
                    disabled={column.required}
                  />
                  <Label
                    htmlFor={column.id}
                    className={`flex-1 cursor-pointer ${
                      column.required ? "text-muted-foreground" : ""
                    }`}
                  >
                    {column.label}
                    {column.required && (
                      <span className="text-xs ml-2">(Required)</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="text-sm text-muted-foreground">
            <strong>{selectedColumns.length}</strong> of {AVAILABLE_COLUMNS.length} columns selected
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || selectedColumns.length === 0}
          >
            {exporting ? (
              "Exporting..."
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CsvExportDialog;
