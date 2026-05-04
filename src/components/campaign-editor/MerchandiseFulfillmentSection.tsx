import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface MerchandiseFulfillmentData {
  merchShipsByDate: string;
  merchPickupAvailable: boolean;
  merchPickupNote: string;
  merchShippingFlatRate: string;
  merchItemsHeading: string;
  merchItemsSubheading: string;
}

interface Props {
  data: MerchandiseFulfillmentData;
  onUpdate: (updates: Partial<MerchandiseFulfillmentData>) => void;
}

export function MerchandiseFulfillmentSection({ data, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="merch-items-heading">Items section heading</Label>
        <Input
          id="merch-items-heading"
          placeholder="Pick your size."
          value={data.merchItemsHeading}
          onChange={(e) => onUpdate({ merchItemsHeading: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Title shown above your items on the landing page. The last word is italicized for emphasis. Leave blank to use the default.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="merch-items-subheading">Items section subheading</Label>
        <Textarea
          id="merch-items-subheading"
          rows={2}
          placeholder="Each item maxes out at the per-person limit shown — kindly leave some for everyone."
          value={data.merchItemsSubheading}
          onChange={(e) => onUpdate({ merchItemsSubheading: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Short sentence shown below the items heading. Leave blank to use the default.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="merch-ships-by">Ships by date</Label>
        <Input
          id="merch-ships-by"
          type="date"
          value={data.merchShipsByDate}
          onChange={(e) => onUpdate({ merchShipsByDate: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Shown on the landing page and cart as "Ships by {`{date}`}". Leave blank to hide.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="merch-shipping-flat">Flat shipping rate ($)</Label>
        <Input
          id="merch-shipping-flat"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 5.00"
          value={data.merchShippingFlatRate}
          onChange={(e) => onUpdate({ merchShippingFlatRate: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Added as a separate line in the cart. Leave blank to hide the shipping line entirely.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="merch-pickup-available">Offer local pickup</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Donors will see "Pickup option at next checkout step." on the cart.
            </p>
          </div>
          <Switch
            id="merch-pickup-available"
            checked={data.merchPickupAvailable}
            onCheckedChange={(checked) => onUpdate({ merchPickupAvailable: checked })}
          />
        </div>

        {data.merchPickupAvailable && (
          <div className="space-y-2">
            <Label htmlFor="merch-pickup-note">Pickup instructions (optional)</Label>
            <Textarea
              id="merch-pickup-note"
              rows={4}
              placeholder="e.g. Pick up at the main office Mon–Fri 8am–4pm starting March 18."
              value={data.merchPickupNote}
              onChange={(e) => onUpdate({ merchPickupNote: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}