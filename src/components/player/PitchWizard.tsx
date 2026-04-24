import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  X,
  Upload,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Mic,
} from "lucide-react";
import { VideoRecorder } from "@/components/VideoRecorder";
import { cn } from "@/lib/utils";

interface PitchWizardProps {
  campaignId: string;
  campaignName: string;
  initialPitch?: {
    message: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    recordedVideoUrl?: string | null;
  };
  onSave: () => void;
  onClose: () => void;
}

type StepKey = "message" | "headshot" | "record";

const STEPS: { key: StepKey; label: string; icon: typeof MessageSquare }[] = [
  { key: "message", label: "Message", icon: MessageSquare },
  { key: "headshot", label: "Headshot", icon: ImageIcon },
  { key: "record", label: "Record", icon: Video },
];

const MAX_MESSAGE = 280;

export function PitchWizard({
  campaignId,
  campaignName,
  initialPitch,
  onSave,
  onClose,
}: PitchWizardProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stepIdx, setStepIdx] = useState(0);
  const [message, setMessage] = useState(initialPitch?.message || "");
  const [imageUrl, setImageUrl] = useState(initialPitch?.imageUrl || "");
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(
    initialPitch?.recordedVideoUrl || ""
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const completed = {
    message: message.trim().length > 0,
    headshot: !!imageUrl,
    record: !!recordedVideoUrl,
  };
  const completeCount =
    Number(completed.message) + Number(completed.headshot) + Number(completed.record);

  const SUGGESTIONS = [
    `Hey! I'm fundraising for ${campaignName} — every dollar puts me closer to our goal.`,
    `Your donation keeps us in jerseys, gym time, and away-game buses. Thank you!`,
    `Any amount helps — even a $5 share feels huge when I see your name pop up. 🙏`,
  ];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload a JPG or PNG.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${campaignId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("pitch-media")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("pitch-media").getPublicUrl(fileName);
      setImageUrl(publicUrl);
      toast({ title: "Photo uploaded", description: "Looking sharp!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("save-roster-pitch", {
        body: {
          campaignId,
          pitchMessage: message.trim() || null,
          pitchImageUrl: imageUrl || null,
          pitchVideoUrl: null,
          pitchRecordedVideoUrl: recordedVideoUrl || null,
        },
      });
      if (error) throw error;
      toast({ title: "Pitch saved!", description: "Your personal pitch is live." });
      onSave();
    } catch (err) {
      console.error(err);
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isLast = stepIdx === STEPS.length - 1;
  const currentStep = STEPS[stepIdx];

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Build your pitch — {campaignName}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Message · headshot · video. All three together raise{" "}
          <span className="font-semibold text-foreground">3.2× more</span>.
        </p>
      </div>

      {/* Stepper */}
      <div className="px-6 pb-5 border-b">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const isActive = i === stepIdx;
            const isComplete = completed[s.key];
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => setStepIdx(i)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors w-full justify-center sm:justify-start sm:w-auto",
                    isActive
                      ? "bg-foreground text-background"
                      : isComplete
                      ? "bg-foreground/90 text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                      isActive || isComplete
                        ? "bg-background/20 text-background"
                        : "bg-background text-muted-foreground"
                    )}
                  >
                    {isComplete ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <Icon className="h-3.5 w-3.5 hidden sm:inline" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-border hidden sm:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 overflow-y-auto flex-1">
        <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Step {stepIdx + 1} · {currentStep.label}
        </div>

        {currentStep.key === "message" && (
          <MessageStep
            message={message}
            setMessage={setMessage}
            suggestions={SUGGESTIONS}
          />
        )}

        {currentStep.key === "headshot" && (
          <HeadshotStep
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            uploading={uploading}
            onPick={() => fileInputRef.current?.click()}
          />
        )}

        {currentStep.key === "record" && (
          <RecordStep
            campaignId={campaignId}
            recordedVideoUrl={recordedVideoUrl}
            setRecordedVideoUrl={setRecordedVideoUrl}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t flex items-center justify-between gap-3 bg-muted/30">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{completeCount} of 3</span> complete
        </div>
        <div className="flex items-center gap-2">
          {stepIdx > 0 && (
            <Button variant="ghost" onClick={() => setStepIdx((i) => i - 1)} disabled={saving}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
          )}
          {!isLast ? (
            <Button onClick={() => setStepIdx((i) => i + 1)} disabled={saving}>
              Continue
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving || completeCount === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Finish all 3 to save
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageStep({
  message,
  setMessage,
  suggestions,
}: {
  message: string;
  setMessage: (s: string) => void;
  suggestions: string[];
}) {
  return (
    <div className="mt-2 space-y-5">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">
          Say it in your own voice
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This is the note that shows on your donation page, above your pitch video.
        </p>
      </div>

      <div className="relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
          rows={5}
          maxLength={MAX_MESSAGE}
          placeholder="Write a quick note to your supporters..."
          className="resize-none pr-16"
        />
        <div className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground tabular-nums">
          {message.length}/{MAX_MESSAGE}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">
          Not sure where to start? Try one:
        </div>
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setMessage(s.slice(0, MAX_MESSAGE))}
              className="w-full text-left flex items-start gap-2.5 rounded-lg border border-dashed border-border bg-background px-3.5 py-2.5 text-sm text-foreground/90 hover:border-foreground/40 hover:bg-muted/40 transition-colors"
            >
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeadshotStep({
  imageUrl,
  setImageUrl,
  uploading,
  onPick,
}: {
  imageUrl: string;
  setImageUrl: (s: string) => void;
  uploading: boolean;
  onPick: () => void;
}) {
  return (
    <div className="mt-2 space-y-5">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">
          Put a face to the ask
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This image shows on your donation page, QR poster, and leaderboard avatar.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          {imageUrl ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted">
              <img src={imageUrl} alt="Headshot" className="h-full w-full object-cover" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => setImageUrl("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onPick}
              disabled={uploading}
              className="aspect-square w-full rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-center px-6 hover:border-foreground/40 hover:bg-muted/40 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="h-7 w-7 text-muted-foreground" />
                  <div className="text-sm font-medium">Click to upload</div>
                  <div className="text-xs text-muted-foreground">JPG, PNG · 5MB max</div>
                </>
              )}
            </button>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onPick}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            {imageUrl ? "Replace photo" : "Upload photo"}
          </Button>
        </div>

        <div className="rounded-xl bg-muted/50 border p-4">
          <div className="text-sm font-semibold mb-2">Tips for a great shot</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-foreground/40">•</span> Face the camera, chest up</li>
            <li className="flex gap-2"><span className="text-foreground/40">•</span> Wear team jersey or colors</li>
            <li className="flex gap-2"><span className="text-foreground/40">•</span> Natural light, no sunglasses</li>
            <li className="flex gap-2"><span className="text-foreground/40">•</span> Square crop works best</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function RecordStep({
  campaignId,
  recordedVideoUrl,
  setRecordedVideoUrl,
}: {
  campaignId: string;
  recordedVideoUrl: string;
  setRecordedVideoUrl: (s: string) => void;
}) {
  return (
    <div className="mt-2 space-y-5">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">
          30–60 seconds. Be yourself.
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Donors who watch a pitch give 3.2× more on average.
        </p>
      </div>

      {/* Dark stage container wrapping the existing recorder */}
      <div className="rounded-xl bg-slate-900 p-4 sm:p-5 [background-image:repeating-linear-gradient(45deg,hsl(220_15%_18%)_0_10px,hsl(220_15%_15%)_10px_20px)]">
        {!recordedVideoUrl && (
          <div className="text-center text-slate-300 mb-4 pt-4">
            <Mic className="h-8 w-8 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-medium">Tap record when ready</div>
            <div className="text-xs text-slate-400 mt-1">
              Donors who watch a pitch give 3.2× more on average.
            </div>
          </div>
        )}

        <div className="rounded-lg overflow-hidden bg-black/40">
          <VideoRecorder
            campaignId={campaignId}
            existingVideoUrl={recordedVideoUrl || null}
            onVideoChange={(url) => setRecordedVideoUrl(url || "")}
            maxDuration={60}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Intro yourself", "Why the team matters", "The ask"].map((p) => (
            <span
              key={p}
              className="rounded-full bg-white/10 text-slate-200 text-xs px-3 py-1 border border-white/10"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
