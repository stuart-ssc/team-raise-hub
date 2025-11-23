import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { toast } from "@/hooks/use-toast";

interface ReceiptScannerProps {
  onImageCaptured?: (imageData: string) => void;
}

const ReceiptScanner = ({ onImageCaptured }: ReceiptScannerProps) => {
  const { takePicture, pickFromGallery, isLoading } = useCamera();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleTakePicture = async () => {
    const result = await takePicture();
    
    if (result?.dataUrl) {
      setCapturedImage(result.dataUrl);
      onImageCaptured?.(result.dataUrl);
      
      toast({
        title: "Receipt Captured",
        description: "Your receipt has been successfully scanned",
      });
    }
  };

  const handlePickFromGallery = async () => {
    const result = await pickFromGallery();
    
    if (result?.dataUrl) {
      setCapturedImage(result.dataUrl);
      onImageCaptured?.(result.dataUrl);
      
      toast({
        title: "Receipt Selected",
        description: "Your receipt has been successfully loaded",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt Scanner</CardTitle>
        <CardDescription>
          Scan or upload your donation receipt for record keeping
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {capturedImage ? (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img 
                src={capturedImage} 
                alt="Scanned receipt" 
                className="w-full h-auto"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleTakePicture}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Retake Photo
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handlePickFromGallery}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Choose Different
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Button 
              onClick={handleTakePicture}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-5 w-5" />
                  Take Photo
                </>
              )}
            </Button>
            
            <Button 
              onClick={handlePickFromGallery}
              disabled={isLoading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <ImageIcon className="mr-2 h-5 w-5" />
              Choose from Gallery
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Receipt images are processed securely and stored for tax purposes
        </p>
      </CardContent>
    </Card>
  );
};

export default ReceiptScanner;
