import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, Plus, X, RotateCcw } from "lucide-react";

const DEFAULT_PRESETS = [25, 50, 100, 250, 500, 1000];

export interface DonationSettingsData {
  donationMinAmount: string;
  donationSuggestedAmounts: number[];
  donationAllowRecurring: boolean;
  donationAllowDedication: boolean;
}

interface Props {
  data: DonationSettingsData;
  onUpdate: (updates: Partial<DonationSettingsData>) => void;
}

export function DonationSettingsSection({ data, onUpdate }: Props) {
  const [newAmount, setNewAmount] = useState("");

  const addAmount = () => {
    const v = parseFloat(newAmount);
    if (!isNaN(v) && v > 0) {
      const next = Array.from(
        new Set([...(data.donationSuggestedAmounts || []), v])
      ).sort((a, b) => a - b);
      onUpdate({ donationSuggestedAmounts: next });
      setNewAmount("");
    }
  };

  const removeAmount = (idx: number) => {
    const next = (data.donationSuggestedAmounts || []).filter((_, i) => i !== idx);
    onUpdate({ donationSuggestedAmounts: next });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">How donation fundraisers work</p>
            <p className="text-muted-foreground">
              Supporters choose a preset amount or enter a custom one. You can require a minimum, allow recurring gifts, and let donors dedicate their gift in honor or memory of someone.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 max-w-xs">
        <Label htmlFor="donationMinAmount">Minimum donation ($)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="donationMinAmount"
            type="number"
            step="1"
            min="1"
            placeholder="5"
            className="pl-7"
            value={data.donationMinAmount || ""}
            onChange={(e) => onUpdate({ donationMinAmount: e.target.value })}
          />
        </div>
        <p className="text-xs text-muted-foreground">Defaults to $5 if blank.</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Suggested donation amounts</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => onUpdate({ donationSuggestedAmounts: DEFAULT_PRESETS })}
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reset to defaults
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(data.donationSuggestedAmounts || []).map((amt, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1 pr-1">
              ${amt.toLocaleString()}
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
          {(!data.donationSuggestedAmounts || data.donationSuggestedAmounts.length === 0) && (
            <p className="text-xs text-muted-foreground">No presets — donors will only see a custom amount field.</p>
          )}
        </div>
        <div className="flex gap-2 max-w-xs">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              step="1"
              min="1"
              placeholder="100"
              className="pl-7"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
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
        <p className="text-xs text-muted-foreground">Quick-pick chips supporters will see at checkout.</p>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-md border p-4">
        <div>
          <Label className="font-medium">Allow recurring donations</Label>
          <p className="text-sm text-muted-foreground mt-0.5">
            Let donors choose to give monthly instead of one-time.
          </p>
        </div>
        <Switch
          checked={data.donationAllowRecurring !== false}
          onCheckedChange={(checked) => onUpdate({ donationAllowRecurring: checked })}
        />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-md border p-4">
        <div>
          <Label className="font-medium">Allow dedications</Label>
          <p className="text-sm text-muted-foreground mt-0.5">
            Let donors mark their gift "in honor of" or "in memory of" someone.
          </p>
        </div>
        <Switch
          checked={data.donationAllowDedication !== false}
          onCheckedChange={(checked) => onUpdate({ donationAllowDedication: checked })}
        />
      </div>
    </div>
  );
}