import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Image, Video, MessageSquare, Eye } from "lucide-react";
import { VideoRecorder } from "@/components/VideoRecorder";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CampaignPitchEditorProps {
  campaignId: string;
  initialPitch?: {
    message: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    recordedVideoUrl?: string | null;
  };
  onSave: () => void;
}

export function CampaignPitchEditor({ 
  campaignId, 
  initialPitch, 
  onSave 
}: CampaignPitchEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [pitchMessage, setPitchMessage] = useState(initialPitch?.message || "");
  const [pitchImageUrl, setPitchImageUrl] = useState(initialPitch?.imageUrl || "");
  const [pitchVideoUrl, setPitchVideoUrl] = useState(initialPitch?.videoUrl || "");
  const [pitchRecordedVideoUrl, setPitchRecordedVideoUrl] = useState(initialPitch?.recordedVideoUrl || "");
  const [videoOption, setVideoOption] = useState<'record' | 'link'>(
    initialPitch?.recordedVideoUrl ? 'record' : 'link'
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("edit");

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `campaigns/${campaignId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pitch-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pitch-media')
        .getPublicUrl(fileName);

      setPitchImageUrl(publicUrl);
      toast({
        title: "Image uploaded",
        description: "Your photo has been uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPitchImageUrl("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('save-campaign-pitch', {
        body: {
          campaignId,
          pitchMessage: pitchMessage.trim() || null,
          pitchImageUrl: pitchImageUrl || null,
          pitchVideoUrl: videoOption === 'link' ? (pitchVideoUrl || null) : null,
          pitchRecordedVideoUrl: videoOption === 'record' ? (pitchRecordedVideoUrl || null) : null,
        },
      });

      if (error) throw error;

      toast({
        title: "Pitch saved!",
        description: "Your campaign pitch has been updated",
      });
      onSave();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save your pitch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return null;
    
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    
    return null;
  };

  const embedUrl = getVideoEmbedUrl(pitchVideoUrl);
  const hasPitch = pitchMessage || pitchImageUrl || pitchVideoUrl || pitchRecordedVideoUrl;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4 mt-4">
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="campaign-pitch-message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Campaign Message
            </Label>
            <Textarea
              id="campaign-pitch-message"
              placeholder="Share why this campaign matters and how supporters can make a difference..."
              value={pitchMessage}
              onChange={(e) => setPitchMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {pitchMessage.length}/500 characters
            </p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Campaign Photo (optional)
            </Label>
            {pitchImageUrl ? (
              <div className="relative w-full max-w-xs">
                <img 
                  src={pitchImageUrl} 
                  alt="Campaign pitch photo" 
                  className="w-full rounded-lg border object-cover aspect-square"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveImage}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload a photo
                    </p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Video Options */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Campaign Video (optional)
            </Label>
            
            <RadioGroup
              value={videoOption}
              onValueChange={(value) => setVideoOption(value as 'record' | 'link')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="record" id="campaign-record" />
                <Label htmlFor="campaign-record" className="cursor-pointer font-normal">Record a video</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="campaign-link" />
                <Label htmlFor="campaign-link" className="cursor-pointer font-normal">Paste a link</Label>
              </div>
            </RadioGroup>

            {videoOption === 'record' ? (
              <VideoRecorder
                campaignId={campaignId}
                existingVideoUrl={pitchRecordedVideoUrl || null}
                onVideoChange={(url) => setPitchRecordedVideoUrl(url || "")}
                maxDuration={60}
              />
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Paste a YouTube or Vimeo link"
                  value={pitchVideoUrl}
                  onChange={(e) => setPitchVideoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Supports YouTube and Vimeo links
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview - How donors will see the campaign pitch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pitchImageUrl && (
                <div className="flex justify-center">
                  <img 
                    src={pitchImageUrl} 
                    alt="Campaign photo" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-lg"
                  />
                </div>
              )}
              
              {pitchMessage ? (
                <blockquote className="text-center italic text-muted-foreground border-l-4 border-primary/30 pl-4 py-2">
                  "{pitchMessage}"
                </blockquote>
              ) : (
                <p className="text-center text-muted-foreground text-sm">
                  No message added yet
                </p>
              )}

              {videoOption === 'record' && pitchRecordedVideoUrl && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <video
                    src={pitchRecordedVideoUrl}
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                  />
                </div>
              )}

              {videoOption === 'link' && embedUrl && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {!hasPitch && (
                <Alert>
                  <AlertDescription>
                    Add a message, photo, or video to personalize your campaign!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} type="button">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Pitch'
          )}
        </Button>
      </div>
    </div>
  );
}
