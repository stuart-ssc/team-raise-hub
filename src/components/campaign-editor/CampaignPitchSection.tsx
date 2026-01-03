import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { CampaignPitchEditor } from "@/components/CampaignPitchEditor";
import { useToast } from "@/hooks/use-toast";

interface CampaignPitch {
  message: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  recordedVideoUrl: string | null;
}

interface CampaignPitchSectionProps {
  campaignId: string;
  initialPitch?: CampaignPitch;
}

export function CampaignPitchSection({ campaignId, initialPitch }: CampaignPitchSectionProps) {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This pitch will be shown to all donors. If roster attribution is enabled, individual roster members can add their own pitch which will override this on their personal links.
        </AlertDescription>
      </Alert>
      
      <CampaignPitchEditor
        campaignId={campaignId}
        initialPitch={initialPitch}
        onSave={() => {
          toast({
            title: "Pitch updated",
            description: "Your campaign pitch has been saved.",
          });
        }}
      />
    </div>
  );
}
