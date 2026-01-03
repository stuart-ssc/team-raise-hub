import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface DonorExperienceData {
  thankYouMessage: string;
  requiresBusinessInfo: boolean;
  fileUploadDeadlineDays: string;
}

interface DonorExperienceSectionProps {
  data: DonorExperienceData;
  onUpdate: (updates: Partial<DonorExperienceData>) => void;
}

export function DonorExperienceSection({ data, onUpdate }: DonorExperienceSectionProps) {
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
            <Label className="text-base">Require Business Info</Label>
            <p className="text-sm text-muted-foreground">
              Collect sponsor details at checkout
            </p>
          </div>
          <Switch
            checked={data.requiresBusinessInfo}
            onCheckedChange={(checked) => onUpdate({ requiresBusinessInfo: checked })}
          />
        </div>

        {data.requiresBusinessInfo && (
          <div className="space-y-2">
            <Label htmlFor="fileUploadDeadline">Upload Deadline (days)</Label>
            <Input
              id="fileUploadDeadline"
              type="number"
              placeholder="e.g., 14"
              value={data.fileUploadDeadlineDays}
              onChange={(e) => onUpdate({ fileUploadDeadlineDays: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              Days after purchase to upload files (logo, ad copy, etc.)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
