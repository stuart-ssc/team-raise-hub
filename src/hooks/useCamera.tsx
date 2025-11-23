import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from '@/hooks/use-toast';

interface CameraResult {
  base64String?: string;
  dataUrl?: string;
  path?: string;
  webPath?: string;
}

export const useCamera = () => {
  const [isLoading, setIsLoading] = useState(false);

  const checkPermissions = async () => {
    try {
      const permissions = await Camera.checkPermissions();
      
      if (permissions.camera !== 'granted') {
        const request = await Camera.requestPermissions({ permissions: ['camera'] });
        return request.camera === 'granted';
      }
      
      return true;
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  };

  const takePicture = async (): Promise<CameraResult | null> => {
    setIsLoading(true);
    
    try {
      const hasPermission = await checkPermissions();
      
      if (!hasPermission) {
        toast({
          title: "Camera Permission Required",
          description: "Please enable camera access in your device settings",
          variant: "destructive"
        });
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        saveToGallery: false
      });

      return {
        base64String: image.base64String,
        dataUrl: `data:image/${image.format};base64,${image.base64String}`,
        path: image.path,
        webPath: image.webPath
      };
    } catch (error: any) {
      if (error?.message !== 'User cancelled photos app') {
        console.error('Error taking picture:', error);
        toast({
          title: "Camera Error",
          description: "Failed to capture image. Please try again.",
          variant: "destructive"
        });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGallery = async (): Promise<CameraResult | null> => {
    setIsLoading(true);
    
    try {
      const hasPermission = await checkPermissions();
      
      if (!hasPermission) {
        toast({
          title: "Gallery Permission Required",
          description: "Please enable photo library access in your device settings",
          variant: "destructive"
        });
        return null;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        saveToGallery: false
      });

      return {
        base64String: image.base64String,
        dataUrl: `data:image/${image.format};base64,${image.base64String}`,
        path: image.path,
        webPath: image.webPath
      };
    } catch (error: any) {
      if (error?.message !== 'User cancelled photos app') {
        console.error('Error picking from gallery:', error);
        toast({
          title: "Gallery Error",
          description: "Failed to select image. Please try again.",
          variant: "destructive"
        });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    takePicture,
    pickFromGallery,
    isLoading,
    checkPermissions
  };
};
