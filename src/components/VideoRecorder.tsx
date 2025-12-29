import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, Square, Play, RotateCcw, Trash2, Camera } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoRecorderProps {
  campaignId: string;
  existingVideoUrl?: string | null;
  onVideoChange: (url: string | null) => void;
  maxDuration?: number; // in seconds
}

type RecorderState = 'idle' | 'requesting' | 'previewing' | 'recording' | 'recorded';

export function VideoRecorder({ 
  campaignId, 
  existingVideoUrl, 
  onVideoChange,
  maxDuration = 30 
}: VideoRecorderProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [state, setState] = useState<RecorderState>(existingVideoUrl ? 'recorded' : 'idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(existingVideoUrl || null);
  const [countdown, setCountdown] = useState(maxDuration);
  const [uploading, setUploading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const requestCamera = async () => {
    setState('requesting');
    setPermissionError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      
      setState('previewing');
    } catch (error: any) {
      console.error('Camera permission error:', error);
      let message = 'Unable to access camera and microphone.';
      
      if (error.name === 'NotAllowedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        message = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        message = 'Camera is in use by another application.';
      }
      
      setPermissionError(message);
      setState('idle');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    setCountdown(maxDuration);
    
    // Determine supported MIME type
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';
    
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      
      stopStream();
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = false;
      }
      
      setState('recorded');
    };
    
    mediaRecorder.start(100); // Collect data every 100ms
    setState('recording');
    
    // Start countdown
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const reRecord = async () => {
    setRecordedBlob(null);
    if (recordedUrl && !recordedUrl.startsWith('http')) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    onVideoChange(null);
    await requestCamera();
  };

  const deleteVideo = () => {
    stopStream();
    setRecordedBlob(null);
    if (recordedUrl && !recordedUrl.startsWith('http')) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    onVideoChange(null);
    setState('idle');
    
    toast({
      title: "Video removed",
      description: "Your recorded video has been deleted",
    });
  };

  const uploadVideo = async (): Promise<string | null> => {
    if (!recordedBlob) return null;
    
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `${user.id}/${campaignId}-video-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pitch-media')
        .upload(fileName, recordedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pitch-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Expose upload function via onVideoChange when there's a new recording
  useEffect(() => {
    if (recordedBlob && state === 'recorded') {
      // When we have a new recording, we need to upload it before saving
      // The parent component will call this when saving
      (async () => {
        try {
          const url = await uploadVideo();
          if (url) {
            onVideoChange(url);
          }
        } catch (error) {
          toast({
            title: "Upload failed",
            description: "Failed to upload video. Please try again.",
            variant: "destructive",
          });
        }
      })();
    }
  }, [recordedBlob]);

  const cancelPreview = () => {
    stopStream();
    setState('idle');
  };

  return (
    <div className="space-y-4">
      {permissionError && (
        <Alert variant="destructive">
          <AlertDescription>{permissionError}</AlertDescription>
        </Alert>
      )}

      {/* Video display area */}
      {(state === 'previewing' || state === 'recording' || state === 'recorded') && (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            controls={state === 'recorded'}
          />
          
          {/* Recording indicator */}
          {state === 'recording' && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {countdown}s
            </div>
          )}
        </div>
      )}

      {/* Existing video from URL */}
      {state === 'idle' && existingVideoUrl && (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={existingVideoUrl}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        {state === 'idle' && (
          <Button 
            variant="outline" 
            onClick={requestCamera}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            {existingVideoUrl ? 'Record New Video' : 'Record Video'}
          </Button>
        )}

        {state === 'requesting' && (
          <Button variant="outline" disabled className="flex-1">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Requesting camera...
          </Button>
        )}

        {state === 'previewing' && (
          <>
            <Button 
              variant="destructive" 
              onClick={startRecording}
              className="flex-1"
            >
              <Video className="h-4 w-4 mr-2" />
              Start Recording ({maxDuration}s max)
            </Button>
            <Button variant="outline" onClick={cancelPreview}>
              Cancel
            </Button>
          </>
        )}

        {state === 'recording' && (
          <Button 
            variant="destructive" 
            onClick={stopRecording}
            className="flex-1"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </Button>
        )}

        {state === 'recorded' && (
          <>
            <Button 
              variant="outline" 
              onClick={reRecord}
              className="flex-1"
              disabled={uploading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Re-record
            </Button>
            <Button 
              variant="outline" 
              onClick={deleteVideo}
              disabled={uploading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            )}
          </>
        )}

        {state === 'idle' && existingVideoUrl && (
          <Button variant="outline" onClick={deleteVideo}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Record a short personal video (up to {maxDuration} seconds) to connect with potential donors.
      </p>
    </div>
  );
}
