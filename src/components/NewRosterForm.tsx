import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewRosterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { rosterYear: number; currentRoster: boolean }) => void;
}

export const NewRosterForm = ({ open, onOpenChange, onSubmit }: NewRosterFormProps) => {
  const [rosterYear, setRosterYear] = useState("");
  const [currentRoster, setCurrentRoster] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const year = parseInt(rosterYear);
    if (isNaN(year) || year < 1900 || year > 2100) {
      return;
    }

    onSubmit({
      rosterYear: year,
      currentRoster,
    });

    // Reset form
    setRosterYear("");
    setCurrentRoster(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Roster</DialogTitle>
          <DialogDescription>
            Add a new roster for the selected group.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roster-year" className="text-right">
                Roster Year
              </Label>
              <Input
                id="roster-year"
                type="number"
                value={rosterYear}
                onChange={(e) => setRosterYear(e.target.value)}
                className="col-span-3"
                placeholder="2024"
                required
                min="1900"
                max="2100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-roster" className="text-right">
                Current Roster
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="current-roster"
                  checked={currentRoster}
                  onCheckedChange={(checked) => setCurrentRoster(checked as boolean)}
                />
                <Label htmlFor="current-roster" className="text-sm">
                  Mark as current roster
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Roster</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};