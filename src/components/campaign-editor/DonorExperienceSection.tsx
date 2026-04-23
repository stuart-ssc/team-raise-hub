import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
      <div className="rounded-lg border p-4 space-y-3">
        <div className="space-y-1">
          <Label className="text-base">Platform Fee Model</Label>
          <p className="text-sm text-muted-foreground">
            Choose who pays Sponsorly's 10% platform fee for this fundraiser.
          </p>
        </div>
        <RadioGroup
          value={data.feeModel || 'donor_covers'}
          onValueChange={(value) =>
            onUpdate({ feeModel: value as 'donor_covers' | 'org_absorbs' })
          }
          className="gap-3"
        >
          <div className="flex items-start gap-3 rounded-md border p-3">
            <RadioGroupItem value="donor_covers" id="fee-donor-covers" className="mt-1" />
            <Label htmlFor="fee-donor-covers" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Donor covers fees (recommended)</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                A 10% platform fee is added on top of the donation. Your organization receives 100% of the intended donation.
              </div>
            </Label>
          </div>
          <div className="flex items-start gap-3 rounded-md border p-3">
            <RadioGroupItem value="org_absorbs" id="fee-org-absorbs" className="mt-1" />
            <Label htmlFor="fee-org-absorbs" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Organization absorbs fees</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Donors pay only the headline price. The 10% platform fee is deducted from your payout.
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

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
