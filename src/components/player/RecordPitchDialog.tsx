import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PitchWizard } from "@/components/player/PitchWizard";

interface RecordPitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
  initialPitch?: {
    message: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    recordedVideoUrl?: string | null;
  };
  onSaved?: () => void;
}

export function RecordPitchDialog({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  initialPitch,
  onSaved,
}: RecordPitchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <PitchWizard
          campaignId={campaignId}
          campaignName={campaignName}
          initialPitch={initialPitch}
          onSave={() => {
            onSaved?.();
            onOpenChange(false);
          }}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
