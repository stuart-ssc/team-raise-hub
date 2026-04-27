import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Plus, X } from "lucide-react";

interface PledgeData {
  pledgeUnitLabel: string;
  pledgeUnitLabelPlural: string;
  pledgeScope: 'team' | 'participant';
  pledgeEventDate: string;
  pledgeMinPerUnit: string;
  pledgeSuggestedUnitAmounts: number[];
  enableRosterAttribution?: boolean;
}

interface PledgeSettingsSectionProps {
  data: PledgeData;
  onUpdate: (updates: Partial<PledgeData>) => void;
}

export function PledgeSettingsSection({ data, onUpdate }: PledgeSettingsSectionProps) {
  const [newAmount, setNewAmount] = useState<string>("");

  const setScope = (scope: 'team' | 'participant') => {
    if (scope === 'participant') {
      onUpdate({ pledgeScope: scope, enableRosterAttribution: true });
    } else {
      onUpdate({ pledgeScope: scope });
    }
  };

  const addAmount = () => {
    const v = parseFloat(newAmount);
    if (!isNaN(v) && v > 0) {
      const next = [...(data.pledgeSuggestedUnitAmounts || []), v].sort((a, b) => a - b);
      onUpdate({ pledgeSuggestedUnitAmounts: next });
      setNewAmount("");
    }
  };

  const removeAmount = (idx: number) => {
    const next = (data.pledgeSuggestedUnitAmounts || []).filter((_, i) => i !== idx);
    onUpdate({ pledgeSuggestedUnitAmounts: next });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">How pledge fundraisers work</p>
            <p className="text-muted-foreground">
              Supporters commit a rate per unit (e.g. $1 per lap) and authorize their card. They aren't charged until you record the final unit count after your event. Each supporter can also set an optional cap on their total charge.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pledgeUnitLabel">Unit label (singular)</Label>
          <Input
            id="pledgeUnitLabel"
            placeholder="lap"
            value={data.pledgeUnitLabel || ""}
            onChange={(e) => onUpdate({ pledgeUnitLabel: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">e.g. lap, mile, point, basket</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pledgeUnitLabelPlural">Unit label (plural)</Label>
          <Input
            id="pledgeUnitLabelPlural"
            placeholder="laps"
            value={data.pledgeUnitLabelPlural || ""}
            onChange={(e) => onUpdate({ pledgeUnitLabelPlural: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pledge scope</Label>
        <RadioGroup
          value={data.pledgeScope || 'team'}
          onValueChange={(v) => setScope(v as 'team' | 'participant')}
          className="gap-3"
        >
          <div className="flex items-start gap-3 rounded-md border p-3">
            <RadioGroupItem value="team" id="scope-team" className="mt-1" />
            <Label htmlFor="scope-team" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Team-wide</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                One unit count applies to everyone (e.g. team total laps).
              </div>
            </Label>
          </div>
          <div className="flex items-start gap-3 rounded-md border p-3">
            <RadioGroupItem value="participant" id="scope-participant" className="mt-1" />
            <Label htmlFor="scope-participant" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Per participant</div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Supporters pledge against a specific roster member; you record each member's units after the event. Roster attribution will be enabled automatically.
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pledgeEventDate">Event date</Label>
          <Input
            id="pledgeEventDate"
            type="date"
            value={data.pledgeEventDate || ""}
            onChange={(e) => onUpdate({ pledgeEventDate: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Cards will be charged after you record results following this date.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pledgeMinPerUnit">Minimum per unit ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="pledgeMinPerUnit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.25"
              className="pl-7"
              value={data.pledgeMinPerUnit || ""}
              onChange={(e) => onUpdate({ pledgeMinPerUnit: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Suggested per-unit amounts</Label>
        <div className="flex flex-wrap gap-2">
          {(data.pledgeSuggestedUnitAmounts || []).map((amt, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1 pr-1">
              ${amt.toFixed(2)}
              <button
                type="button"
                onClick={() => removeAmount(idx)}
                className="ml-1 rounded hover:bg-background p-0.5"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 max-w-xs">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="2.00"
              className="pl-7"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addAmount();
                }
              }}
            />
          </div>
          <Button type="button" variant="outline" onClick={addAmount}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Quick-pick chips supporters will see at checkout.
        </p>
      </div>
    </div>
  );
}