import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

const PREDEFINED_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export interface SizeVariant {
  id?: string;
  size: string;
  quantity_offered: number;
  quantity_available: number;
  display_order: number;
}

interface SizeVariantsEditorProps {
  variants: SizeVariant[];
  onChange: (variants: SizeVariant[]) => void;
  disabled?: boolean;
}

export function SizeVariantsEditor({ variants, onChange, disabled }: SizeVariantsEditorProps) {
  const [newSize, setNewSize] = useState<string>("");
  const [customSize, setCustomSize] = useState<string>("");

  const usedSizes = variants.map(v => v.size);
  const availablePredefinedSizes = PREDEFINED_SIZES.filter(s => !usedSizes.includes(s));

  const addVariant = (size: string) => {
    if (!size || usedSizes.includes(size)) return;
    
    const newVariant: SizeVariant = {
      size,
      quantity_offered: 0,
      quantity_available: 0,
      display_order: variants.length,
    };
    
    onChange([...variants, newVariant]);
    setNewSize("");
    setCustomSize("");
  };

  const updateVariant = (index: number, field: keyof SizeVariant, value: number | string) => {
    const updated = [...variants];
    
    if (field === 'quantity_offered') {
      const numValue = typeof value === 'string' ? parseInt(value) || 0 : value;
      // When updating quantity offered, also update available if they were equal
      const wasEqual = updated[index].quantity_offered === updated[index].quantity_available;
      updated[index].quantity_offered = numValue;
      if (wasEqual || updated[index].quantity_available > numValue) {
        updated[index].quantity_available = numValue;
      }
    } else if (field === 'quantity_available') {
      const numValue = typeof value === 'string' ? parseInt(value) || 0 : value;
      // Don't allow available to exceed offered
      updated[index].quantity_available = Math.min(numValue, updated[index].quantity_offered);
    } else {
      (updated[index] as any)[field] = value;
    }
    
    onChange(updated);
  };

  const removeVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    // Update display_order for remaining variants
    updated.forEach((v, i) => {
      v.display_order = i;
    });
    onChange(updated);
  };

  const getTotalOffered = () => variants.reduce((sum, v) => sum + v.quantity_offered, 0);
  const getTotalAvailable = () => variants.reduce((sum, v) => sum + v.quantity_available, 0);

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Size Inventory</Label>
        <div className="text-sm text-muted-foreground">
          Total: {getTotalAvailable()} / {getTotalOffered()} available
        </div>
      </div>

      {variants.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Size</TableHead>
              <TableHead>Qty Offered</TableHead>
              <TableHead>Qty Available</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant, index) => (
              <TableRow key={variant.size}>
                <TableCell className="font-medium">{variant.size}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={variant.quantity_offered}
                    onChange={(e) => updateVariant(index, 'quantity_offered', e.target.value)}
                    className="w-24"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max={variant.quantity_offered}
                    value={variant.quantity_available}
                    onChange={(e) => updateVariant(index, 'quantity_available', e.target.value)}
                    className="w-24"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {variants.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No sizes added yet. Add sizes below.
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-sm">Add Size</Label>
          <Select value={newSize} onValueChange={(value) => {
            if (value === "custom") {
              setNewSize("custom");
            } else {
              addVariant(value);
            }
          }} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select a size" />
            </SelectTrigger>
            <SelectContent>
              {availablePredefinedSizes.map(size => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
              <SelectItem value="custom">Custom Size...</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {newSize === "custom" && (
          <>
            <div className="flex-1">
              <Label className="text-sm">Custom Size Name</Label>
              <Input
                placeholder="e.g. Youth L, One Size"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                disabled={disabled}
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => addVariant(customSize)}
              disabled={!customSize || disabled}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
