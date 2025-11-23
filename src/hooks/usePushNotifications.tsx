import { useEffect, useState } from 'react';
import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema,
  ActionPerformed 
} from '@capacitor/push-notifications';
import { toast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const initPushNotifications = async () => {
      // Check if push notifications are supported (native only)
      try {
        await PushNotifications.checkPermissions();
        setIsSupported(true);
      } catch (error) {
        console.log('Push notifications not supported on this platform');
        setIsSupported(false);
        return;
      }

      // Request permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Register with Apple / Google to receive push via APNS/FCM
      await PushNotifications.register();

      // On success, we should be able to receive notifications
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        setToken(token.value);
        // TODO: Send token to your backend server
      });

      // Some issue with your setup and push will not work
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
        toast({
          title: "Push Notification Error",
          description: "Failed to register for push notifications",
          variant: "destructive"
        });
      });

      // Show notification when app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received: ', notification);
        
        toast({
          title: notification.title || 'Notification',
          description: notification.body || '',
        });
      });

      // Method called when tapping on a notification
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed', notification);
        
        // Handle navigation based on notification data
        if (notification.notification.data?.route) {
          // TODO: Navigate to specific route
          console.log('Navigate to:', notification.notification.data.route);
        }
      });
    };

    initPushNotifications();

    // Cleanup
    return () => {
      if (isSupported) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  const getDeliveredNotifications = async () => {
    if (!isSupported) return [];
    
    try {
      const notificationList = await PushNotifications.getDeliveredNotifications();
      return notificationList.notifications;
    } catch (error) {
      console.error('Error getting delivered notifications:', error);
      return [];
    }
  };

  const removeAllDeliveredNotifications = async () => {
    if (!isSupported) return;
    
    try {
      await PushNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error('Error removing notifications:', error);
    }
  };

  return {
    token,
    isSupported,
    getDeliveredNotifications,
    removeAllDeliveredNotifications
  };
};
