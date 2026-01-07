import { useState } from 'react';
import { format, addMinutes, setHours, setMinutes, startOfDay, isBefore } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ScheduleMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (scheduledFor: Date) => void;
}

// Generate time options in 15-minute increments
const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = setMinutes(setHours(new Date(), hour), minute);
      options.push({
        value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        label: format(time, 'h:mm a'),
      });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export const ScheduleMessageDialog = ({
  open,
  onOpenChange,
  onSchedule,
}: ScheduleMessageDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    addMinutes(new Date(), 60) // Default to 1 hour from now
  );
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    const defaultTime = addMinutes(new Date(), 60);
    const hours = defaultTime.getHours().toString().padStart(2, '0');
    const minutes = (Math.ceil(defaultTime.getMinutes() / 15) * 15 % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  const handleSchedule = () => {
    if (!selectedDate) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledDate = setMinutes(setHours(startOfDay(selectedDate), hours), minutes);

    if (isBefore(scheduledDate, new Date())) {
      return; // Don't allow scheduling in the past
    }

    onSchedule(scheduledDate);
    onOpenChange(false);
  };

  const getScheduledDateTime = (): Date | null => {
    if (!selectedDate) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    return setMinutes(setHours(startOfDay(selectedDate), hours), minutes);
  };

  const scheduledDateTime = getScheduledDateTime();
  const isValidSchedule = scheduledDateTime && !isBefore(scheduledDateTime, new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Message
          </DialogTitle>
          <DialogDescription>
            Choose when you'd like this message to be sent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => isBefore(date, startOfDay(new Date()))}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {scheduledDateTime && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Will be sent: </span>
              <span className="font-medium">
                {format(scheduledDateTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          )}

          {scheduledDateTime && isBefore(scheduledDateTime, new Date()) && (
            <p className="text-sm text-destructive">
              Please select a future date and time.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={!isValidSchedule}>
            Schedule Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
