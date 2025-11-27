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
  existingYears: number[];
}

export const NewRosterForm = ({ open, onOpenChange, onSubmit, existingYears }: NewRosterFormProps) => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const minYear = currentYear - 3;
  
  const [rosterYear, setRosterYear] = useState(nextYear.toString());
  const [currentRoster, setCurrentRoster] = useState(false);
  const [yearError, setYearError] = useState<string>("");

  const handleYearChange = (value: string) => {
    setRosterYear(value);
    const year = parseInt(value);
    
    if (!isNaN(year) && existingYears.includes(year)) {
      setYearError(`A roster for ${year} already exists for this group`);
    } else {
      setYearError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const year = parseInt(rosterYear);
    if (isNaN(year) || year < minYear || year > 2100) {
      return;
    }

    // Check for duplicate year
    if (existingYears.includes(year)) {
      setYearError(`A roster for ${year} already exists for this group`);
      return;
    }

    onSubmit({
      rosterYear: year,
      currentRoster,
    });

    // Reset form
    setRosterYear(nextYear.toString());
    setCurrentRoster(false);
    setYearError("");
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
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="roster-year" className="text-right pt-2">
                Roster Year
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="roster-year"
                  type="number"
                  value={rosterYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className={yearError ? "border-destructive" : ""}
                  placeholder={nextYear.toString()}
                  required
                  min={minYear}
                  max="2100"
                />
                {yearError && (
                  <p className="text-sm text-destructive">{yearError}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-3 col-start-2 flex items-center space-x-2">
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