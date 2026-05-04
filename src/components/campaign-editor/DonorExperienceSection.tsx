import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RequiredAsset } from "./RequiredAssetsEditor";

interface DonorExperienceData {
  thankYouMessage: string;
  requiresBusinessInfo: boolean;
  fileUploadDeadlineDays: string;
  assetUploadDeadline?: string;
  feeModel?: 'donor_covers' | 'org_absorbs';
}

interface DonorExperienceSectionProps {
  data: DonorExperienceData;
  onUpdate: (updates: Partial<DonorExperienceData>) => void;
  requiredAssets?: RequiredAsset[];
  onRequiredAssetsChange?: (assets: RequiredAsset[]) => void;
}

export function DonorExperienceSection({ 
  data, 
  onUpdate, 
  requiredAssets = [],
  onRequiredAssetsChange 
}: DonorExperienceSectionProps) {
  const deadlineDate = data.assetUploadDeadline ? new Date(data.assetUploadDeadline) : undefined;

  const handleDateChange = (date: Date | undefined) => {
    onUpdate({ 
      assetUploadDeadline: date ? format(date, "yyyy-MM-dd") : undefined 
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="thankYouMessage">Thank You Message</Label>
        <Textarea
          id="thankYouMessage"
          placeholder="Enter a custom thank you message for donors after checkout"
          rows={3}
          value={data.thankYouMessage}
          onChange={(e) => onUpdate({ thankYouMessage: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          This message will be shown to donors after they complete their donation.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-1">
            <Label className="text-base">Sponsorship items</Label>
            <p className="text-sm text-muted-foreground">
              Business info is collected at checkout automatically when a buyer's cart contains a
              sponsorship item. Mark individual items as <strong>Sponsorship items</strong> in the{" "}
              <strong>Items</strong> section to define what assets sponsors must upload after purchase.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Label>Asset Upload Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !deadlineDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadlineDate ? format(deadlineDate, "PPP") : "Select deadline date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={deadlineDate}
                onSelect={handleDateChange}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground">
            The date by which sponsors must upload their assets.
          </p>
        </div>
      </div>
    </div>
  );
}
