import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScheduleData {
  goalAmount: string;
  startDate: string;
  endDate: string;
}

interface ScheduleSectionProps {
  data: ScheduleData;
  onUpdate: (updates: Partial<ScheduleData>) => void;
}

export function ScheduleSection({ data, onUpdate }: ScheduleSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goalAmount">Goal Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="goalAmount"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="pl-7"
            value={data.goalAmount}
            onChange={(e) => onUpdate({ goalAmount: e.target.value })}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Optional fundraising target to display on your fundraiser page
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={data.startDate}
            onChange={(e) => onUpdate({ startDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={data.endDate}
            onChange={(e) => onUpdate({ endDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
