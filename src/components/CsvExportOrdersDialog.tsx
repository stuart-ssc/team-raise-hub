import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter } from "date-fns";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Download, Loader2, FileSpreadsheet, FileText, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

type ExportFormat = "csv" | "xlsx";
type DatePreset = "all" | "this_month" | "last_month" | "this_quarter";

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
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");

  const handleDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case "all":
        setStartDate(undefined);
        setEndDate(undefined);
        break;
      case "this_month":
        setStartDate(startOfMonth(today));
        setEndDate(today);
        break;
      case "last_month":
        const lastMonth = subMonths(today, 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
      case "this_quarter":
        setStartDate(startOfQuarter(today));
        setEndDate(today);
        break;
    }
  };

  // Reset date preset when manually changing dates
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setDatePreset("all");
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    setDatePreset("all");
  };

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
          format: exportFormat,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      });

      if (error) throw error;

      const dateStr = new Date().toISOString().split("T")[0];
      let blob: Blob;
      let filename: string;

      if (exportFormat === "xlsx") {
        // Decode base64 and create Excel blob
        const binaryString = atob(data.xlsx);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        filename = `campaign-orders-${dateStr}.xlsx`;
      } else {
        blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
        filename = `campaign-orders-${dateStr}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.count} orders as ${exportFormat.toUpperCase()}`);
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
          <DialogTitle>Export Orders</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exporting {orderIds.length} order{orderIds.length !== 1 ? "s" : ""}
            {startDate || endDate ? " (filtered by date)" : ""}.
          </p>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={datePreset === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleDatePreset("all")}
              >
                All Time
              </Button>
              <Button
                variant={datePreset === "this_month" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleDatePreset("this_month")}
              >
                This Month
              </Button>
              <Button
                variant={datePreset === "last_month" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleDatePreset("last_month")}
              >
                Last Month
              </Button>
              <Button
                variant={datePreset === "this_quarter" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleDatePreset("this_quarter")}
              >
                This Quarter
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="format-xlsx" />
                <Label htmlFor="format-xlsx" className="flex items-center gap-1.5 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label htmlFor="format-csv" className="flex items-center gap-1.5 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  CSV (.csv)
                </Label>
              </div>
            </RadioGroup>
          </div>

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
                {exportFormat === "xlsx" ? (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
