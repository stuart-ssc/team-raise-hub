import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PitchEditor } from "@/components/PitchEditor";

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record My Pitch</DialogTitle>
          <DialogDescription>
            Personalize your fundraising page for {campaignName}. Add a message, image, or video that supporters will see when they visit your link.
          </DialogDescription>
        </DialogHeader>
        <PitchEditor
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
