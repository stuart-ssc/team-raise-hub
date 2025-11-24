import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download } from "lucide-react";

interface CsvExportBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBusinessIds: string[];
}

const AVAILABLE_COLUMNS = [
  { id: "business_name", label: "Business Name", default: true },
  { id: "ein", label: "EIN", default: true },
  { id: "industry", label: "Industry", default: true },
  { id: "business_email", label: "Email", default: true },
  { id: "business_phone", label: "Phone", default: true },
  { id: "address_line1", label: "Address Line 1", default: false },
  { id: "address_line2", label: "Address Line 2", default: false },
  { id: "city", label: "City", default: true },
  { id: "state", label: "State", default: true },
  { id: "zip", label: "ZIP Code", default: true },
  { id: "country", label: "Country", default: false },
  { id: "website_url", label: "Website", default: false },
  { id: "verification_status", label: "Verification Status", default: true },
  { id: "created_at", label: "Created Date", default: false },
  { id: "verified_at", label: "Verified Date", default: false },
];

export function CsvExportBusinessDialog({
  open,
  onOpenChange,
  selectedBusinessIds,
}: CsvExportBusinessDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.filter(col => col.default).map(col => col.id)
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map(col => col.id));
  };

  const handleSelectDefault = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.filter(col => col.default).map(col => col.id));
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }

    setIsExporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('export-businesses-csv', {
        body: {
          businessIds: selectedBusinessIds,
          columns: selectedColumns,
        },
      });

      if (error) throw error;

      // Create and download the CSV file
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `businesses_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Successfully exported ${data.count} businesses`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting businesses:', error);
      toast.error('Failed to export businesses. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Businesses to CSV</DialogTitle>
          <DialogDescription>
            Select the columns you want to include in your export ({selectedBusinessIds.length} businesses selected)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectDefault}
            >
              Select Default
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-4 border rounded-md">
            {AVAILABLE_COLUMNS.map((column) => (
              <div key={column.id} className="flex items-center space-x-2">
                <Checkbox
                  id={column.id}
                  checked={selectedColumns.includes(column.id)}
                  onCheckedChange={() => handleColumnToggle(column.id)}
                />
                <Label
                  htmlFor={column.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
