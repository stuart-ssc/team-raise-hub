import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";

interface CsvExportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  orderIds: string[];
}

interface CustomField {
  id: string;
  field_name: string;
}

const STANDARD_COLUMNS = [
  { id: "customer_name", label: "Customer Name", default: true },
  { id: "customer_email", label: "Customer Email", default: true },
  { id: "customer_phone", label: "Customer Phone", default: true },
  { id: "items", label: "Items Purchased", default: true },
  { id: "items_total", label: "Amount", default: true },
  { id: "created_at", label: "Order Date", default: true },
  { id: "files_complete", label: "Files Status", default: true },
  { id: "status", label: "Payment Status", default: false },
  { id: "shipping_address", label: "Shipping Address", default: false },
  { id: "business_purchase", label: "Business Purchase", default: false },
  { id: "tax_receipt_issued", label: "Tax Receipt Issued", default: false },
];

export function CsvExportOrdersDialog({
  open,
  onOpenChange,
  campaignId,
  orderIds,
}: CsvExportOrdersDialogProps) {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    STANDARD_COLUMNS.filter((col) => col.default).map((col) => col.id)
  );
  const [isExporting, setIsExporting] = useState(false);

  // Fetch custom fields when dialog opens
  useEffect(() => {
    if (open && campaignId) {
      supabase
        .from("campaign_custom_fields")
        .select("id, field_name")
        .eq("campaign_id", campaignId)
        .order("display_order")
        .then(({ data }) => {
          setCustomFields(data || []);
        });
    }
  }, [open, campaignId]);

  // Combine standard and custom columns
  const allColumns = useMemo(() => {
    const customCols = customFields.map((field) => ({
      id: `custom_${field.id}`,
      label: field.field_name,
      default: false,
    }));
    return [...STANDARD_COLUMNS, ...customCols];
  }, [customFields]);

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(allColumns.map((col) => col.id));
  };

  const handleSelectDefault = () => {
    setSelectedColumns(
      STANDARD_COLUMNS.filter((col) => col.default).map((col) => col.id)
    );
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }

    if (orderIds.length === 0) {
      toast.error("No orders to export");
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-orders-csv", {
        body: {
          orderIds,
          columns: selectedColumns,
          campaignId,
        },
      });

      if (error) throw error;

      // Create and download the CSV file
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campaign-orders-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.count} orders`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export orders");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Orders to CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exporting {orderIds.length} order{orderIds.length !== 1 ? "s" : ""}. Select the columns to include:
          </p>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectDefault}>
              Default Columns
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {STANDARD_COLUMNS.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={selectedColumns.includes(column.id)}
                    onCheckedChange={() => handleColumnToggle(column.id)}
                  />
                  <Label htmlFor={column.id} className="text-sm cursor-pointer">
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
            
            {customFields.length > 0 && (
              <>
                <div className="border-t pt-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Custom Fields</p>
                  <div className="grid grid-cols-2 gap-3">
                    {customFields.map((field) => {
                      const colId = `custom_${field.id}`;
                      return (
                        <div key={colId} className="flex items-center space-x-2">
                          <Checkbox
                            id={colId}
                            checked={selectedColumns.includes(colId)}
                            onCheckedChange={() => handleColumnToggle(colId)}
                          />
                          <Label htmlFor={colId} className="text-sm cursor-pointer">
                            {field.field_name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
