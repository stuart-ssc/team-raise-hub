import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.05880e6fb3164d8095acee3d333b6d78',
  appName: 'Sponsorly',
  webDir: 'dist',
  server: {
    url: 'https://05880e6f-b316-4d80-95ac-ee3d333b6d78.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Camera: {
      permissions: {
        camera: "always"
      }
    }
  }
};

export default config;
