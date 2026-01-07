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

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Loader2, FileSpreadsheet, FileText, CalendarIcon, Save, Trash2, ChevronDown, History, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CsvExportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  orderIds: string[];
  mode?: "single" | "multi";
  organizationId?: string;
}

interface CustomField {
  id: string;
  field_name: string;
}

interface ColumnPreset {
  name: string;
  columns: string[];
}

interface Campaign {
  id: string;
  name: string;
}

interface ExportHistoryItem {
  id: string;
  filename: string;
  order_count: number;
  export_format: string;
  created_at: string;
  filters: {
    statusFilter?: string;
    startDate?: string;
    endDate?: string;
    includeSummary?: boolean;
  };
  columns: string[];
  campaign_id?: string;
  campaign_ids?: string[];
}

type ExportFormat = "csv" | "xlsx";
type DatePreset = "all" | "this_month" | "last_month" | "this_quarter";
type StatusFilter = "all" | "succeeded" | "pending" | "failed";

const PRESETS_STORAGE_KEY = "order-export-column-presets";

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

// Load presets from localStorage
const loadPresets = (): ColumnPreset[] => {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save presets to localStorage
const savePresets = (presets: ColumnPreset[]) => {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
};

// Sanitize filename
const sanitizeFilename = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export function CsvExportOrdersDialog({
  open,
  onOpenChange,
  campaignId,
  orderIds,
  mode = "single",
  organizationId,
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
  
  // Feature 1: Status Filter
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  
  // Feature 2: Summary Row
  const [includeSummary, setIncludeSummary] = useState(false);
  
  // Feature 3: Custom Filename
  const [customFilename, setCustomFilename] = useState("");
  const [campaignName, setCampaignName] = useState("");
  
  // Feature 4: Multi-Campaign
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  
  // Feature 5: Export History
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  // Preset management
  const [presets, setPresets] = useState<ColumnPreset[]>(loadPresets);
  const [newPresetName, setNewPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);

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

  // Fetch campaign info, custom fields, and campaigns list when dialog opens
  useEffect(() => {
    if (open) {
      // Get campaign name for filename
      if (campaignId) {
        supabase
          .from("campaigns")
          .select("name, group_id")
          .eq("id", campaignId)
          .single()
          .then(({ data }) => {
            if (data) {
              setCampaignName(data.name || "");
              // For multi-mode, fetch organization campaigns
              if (mode === "multi" && data.group_id) {
                supabase
                  .from("groups")
                  .select("organization_id")
                  .eq("id", data.group_id)
                  .single()
                  .then(({ data: groupData }) => {
                    if (groupData) {
                      fetchOrganizationCampaigns(groupData.organization_id);
                      fetchExportHistory(groupData.organization_id);
                    }
                  });
              }
            }
          });
        
        // Fetch custom fields
        supabase
          .from("campaign_custom_fields")
          .select("id, field_name")
          .eq("campaign_id", campaignId)
          .order("display_order")
          .then(({ data }) => {
            setCustomFields(data || []);
          });
      }
      
      // Set initial selected campaigns
      if (mode === "multi") {
        setSelectedCampaigns([campaignId]);
        // Add campaign_name column for multi-mode
        if (!selectedColumns.includes("campaign_name")) {
          setSelectedColumns((prev) => ["campaign_name", ...prev]);
        }
      }
      
      // Fetch export history if organizationId is provided
      if (organizationId) {
        fetchExportHistory(organizationId);
      }
    }
  }, [open, campaignId, mode, organizationId]);

  const fetchOrganizationCampaigns = async (orgId: string) => {
    const { data } = await supabase
      .from("campaigns")
      .select("id, name, groups!inner(organization_id)")
      .eq("groups.organization_id", orgId)
      .order("name");
    
    if (data) {
      setCampaigns(data.map((c: any) => ({ id: c.id, name: c.name })));
    }
  };

  const fetchExportHistory = async (orgId: string) => {
    const { data } = await supabase
      .from("order_export_history")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (data) {
      setExportHistory(data as ExportHistoryItem[]);
    }
  };

  // Combine standard and custom columns
  const allColumns = useMemo(() => {
    const baseColumns = mode === "multi"
      ? [{ id: "campaign_name", label: "Campaign Name", default: true }, ...STANDARD_COLUMNS]
      : STANDARD_COLUMNS;
    
    const customCols = customFields.map((field) => ({
      id: `custom_${field.id}`,
      label: field.field_name,
      default: false,
    }));
    return [...baseColumns, ...customCols];
  }, [customFields, mode]);

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
    const defaults = allColumns.filter((col) => col.default).map((col) => col.id);
    setSelectedColumns(defaults);
  };

  const handleCampaignToggle = (campaignId: string) => {
    setSelectedCampaigns((prev) =>
      prev.includes(campaignId)
        ? prev.filter((id) => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  // Preset handlers
  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column");
      return;
    }
    
    const existingIndex = presets.findIndex(
      (p) => p.name.toLowerCase() === newPresetName.trim().toLowerCase()
    );
    
    let updatedPresets: ColumnPreset[];
    if (existingIndex >= 0) {
      updatedPresets = [...presets];
      updatedPresets[existingIndex] = { name: newPresetName.trim(), columns: selectedColumns };
      toast.success(`Updated preset "${newPresetName.trim()}"`);
    } else {
      updatedPresets = [...presets, { name: newPresetName.trim(), columns: selectedColumns }];
      toast.success(`Saved preset "${newPresetName.trim()}"`);
    }
    
    setPresets(updatedPresets);
    savePresets(updatedPresets);
    setNewPresetName("");
    setShowSavePreset(false);
  };

  const handleLoadPreset = (presetName: string) => {
    const preset = presets.find((p) => p.name === presetName);
    if (preset) {
      // Only load columns that exist in current context (standard + custom)
      const validColumns = preset.columns.filter(
        (col) => allColumns.some((c) => c.id === col)
      );
      setSelectedColumns(validColumns);
      toast.success(`Loaded preset "${presetName}"`);
    }
  };

  const handleDeletePreset = (presetName: string) => {
    const updatedPresets = presets.filter((p) => p.name !== presetName);
    setPresets(updatedPresets);
    savePresets(updatedPresets);
    toast.success(`Deleted preset "${presetName}"`);
  };

  // Load from export history
  const handleLoadFromHistory = (historyItem: ExportHistoryItem) => {
    setSelectedColumns(historyItem.columns);
    setExportFormat(historyItem.export_format as ExportFormat);
    if (historyItem.filters) {
      setStatusFilter((historyItem.filters.statusFilter as StatusFilter) || "all");
      setIncludeSummary(historyItem.filters.includeSummary || false);
      if (historyItem.filters.startDate) {
        setStartDate(new Date(historyItem.filters.startDate));
      }
      if (historyItem.filters.endDate) {
        setEndDate(new Date(historyItem.filters.endDate));
      }
    }
    if (historyItem.campaign_ids && mode === "multi") {
      setSelectedCampaigns(historyItem.campaign_ids);
    }
    toast.success("Loaded settings from previous export");
  };

  // Generate filename
  const generateFilename = (): string => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    if (customFilename.trim()) {
      return sanitizeFilename(customFilename);
    }
    const campaignSlug = sanitizeFilename(campaignName || "orders");
    return `${campaignSlug}-orders-${dateStr}`;
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }

    const idsToExport = orderIds;
    if (idsToExport.length === 0) {
      toast.error("No orders to export");
      return;
    }

    setIsExporting(true);
    try {
      const filename = generateFilename();
      
      const { data, error } = await supabase.functions.invoke("export-orders-csv", {
        body: {
          orderIds: idsToExport,
          columns: selectedColumns,
          campaignId: mode === "single" ? campaignId : undefined,
          campaignIds: mode === "multi" ? selectedCampaigns : undefined,
          format: exportFormat,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          statusFilter: statusFilter !== "all" ? statusFilter : undefined,
          includeSummary,
          filename,
          organizationId,
        },
      });

      if (error) throw error;

      let blob: Blob;
      let fullFilename: string;

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
        fullFilename = `${filename}.xlsx`;
      } else {
        blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
        fullFilename = `${filename}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fullFilename;
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

  const filenamePreview = `${generateFilename()}.${exportFormat}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Orders</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Exporting {orderIds.length} order{orderIds.length !== 1 ? "s" : ""}
              {mode === "multi" && selectedCampaigns.length > 1 ? ` from ${selectedCampaigns.length} campaigns` : ""}
              {startDate || endDate ? " (filtered by date)" : ""}
              {statusFilter !== "all" ? ` • ${statusFilter}` : ""}.
            </p>

            {/* Multi-Campaign Selection (Feature 4) */}
            {mode === "multi" && campaigns.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Campaigns</Label>
                <div className="max-h-[120px] overflow-y-auto border rounded-md p-2 space-y-1">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`campaign-${campaign.id}`}
                        checked={selectedCampaigns.includes(campaign.id)}
                        onCheckedChange={() => handleCampaignToggle(campaign.id)}
                      />
                      <Label htmlFor={`campaign-${campaign.id}`} className="text-sm cursor-pointer">
                        {campaign.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Status Filter (Feature 1) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status Filter</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Export Format</Label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel (.xlsx)
                    </span>
                  </SelectItem>
                  <SelectItem value="csv">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV (.csv)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options (Feature 2: Summary Row) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-summary"
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(checked === true)}
                />
                <Label htmlFor="include-summary" className="text-sm cursor-pointer">
                  Include summary row with totals
                </Label>
              </div>
            </div>

            {/* Custom Filename (Feature 3) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filename</Label>
              <Input
                placeholder={sanitizeFilename(campaignName || "orders") + "-orders-" + format(new Date(), "yyyy-MM-dd")}
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">
                Preview: {filenamePreview}
              </p>
            </div>

            {/* Column Selection Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Columns</Label>
                {presets.length > 0 && (
                  <Select onValueChange={handleLoadPreset}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Load preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map((preset) => (
                        <div
                          key={preset.name}
                          className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm"
                        >
                          <SelectItem value={preset.name} className="flex-1 p-0">
                            {preset.name}
                          </SelectItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-2 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePreset(preset.name);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleSelectDefault}>
                  Default
                </Button>
                {!showSavePreset ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowSavePreset(true)}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save Preset
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Input
                      placeholder="Preset name..."
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="h-7 w-28 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSavePreset();
                        if (e.key === "Escape") setShowSavePreset(false);
                      }}
                      autoFocus
                    />
                    <Button size="sm" className="h-7 text-xs" onClick={handleSavePreset}>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setShowSavePreset(false);
                        setNewPresetName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(mode === "multi" ? [{ id: "campaign_name", label: "Campaign Name", default: true }] : []).concat(STANDARD_COLUMNS).map((column) => (
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
                )}
              </div>
            </ScrollArea>

            {/* Export History (Feature 5) */}
            {exportHistory.length > 0 && (
              <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between h-9 text-sm">
                    <span className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Recent Exports
                    </span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", historyOpen && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="space-y-2 max-h-[120px] overflow-y-auto">
                    {exportHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md border text-sm"
                      >
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{item.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "MMM d, yyyy")} • {item.order_count} orders • {item.export_format.toUpperCase()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7"
                          onClick={() => handleLoadFromHistory(item)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Re-export
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
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
