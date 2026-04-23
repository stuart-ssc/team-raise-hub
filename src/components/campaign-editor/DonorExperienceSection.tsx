import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RequiredAssetsEditor, RequiredAsset } from "./RequiredAssetsEditor";

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
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Sponsorship Campaign</Label>
            <p className="text-sm text-muted-foreground">
              Collect sponsor details and assets at checkout
            </p>
          </div>
          <Switch
            checked={data.requiresBusinessInfo}
            onCheckedChange={(checked) => onUpdate({ requiresBusinessInfo: checked })}
          />
        </div>

        {data.requiresBusinessInfo && (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
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
                The date by which sponsors must upload their assets
              </p>
            </div>

            {onRequiredAssetsChange && (
              <RequiredAssetsEditor
                assets={requiredAssets}
                onChange={onRequiredAssetsChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
