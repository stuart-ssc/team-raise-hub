import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PlatformFeeSectionProps {
  feeModel?: 'donor_covers' | 'org_absorbs';
  onUpdate: (updates: { feeModel: 'donor_covers' | 'org_absorbs' }) => void;
}

export function PlatformFeeSection({ feeModel, onUpdate }: PlatformFeeSectionProps) {
  return (
    <RadioGroup
      value={feeModel || 'donor_covers'}
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
  );
}