# Capacitor Native Mobile App Setup

Sponsorly is now configured with Capacitor for native mobile app development! This enables access to device features like camera, push notifications, and more.

## 🚀 Quick Start

### 1. Export to GitHub
First, export your project to GitHub using the "Export to GitHub" button in Lovable.

### 2. Clone and Install
```bash
git clone <your-repo-url>
cd <your-project>
npm install
```

### 3. Add Native Platforms

**For iOS (requires macOS with Xcode):**
```bash
npx cap add ios
npx cap update ios
```

**For Android (requires Android Studio):**
```bash
npx cap add android
npx cap update android
```

### 4. Build Web Assets
```bash
npm run build
```

### 5. Sync Capacitor
```bash
npx cap sync
```

### 6. Open in Native IDE

**iOS:**
```bash
npx cap open ios
```
This opens Xcode. Press the Play button to run on simulator or connected device.

**Android:**
```bash
npx cap open android
```
This opens Android Studio. Click the Run button to launch on emulator or device.

## 📱 Native Features Implemented

### Camera Access
- Scan receipts directly from device camera
- Pick images from photo library
- Used in `ReceiptScanner` component
- Access via `/native-features` page

### Push Notifications
- Real-time donation alerts
- Campaign milestone notifications
- Automatic registration and token management
- Configured with proper permissions

### Progressive Web App (PWA)
- Offline support with service worker
- Installable on mobile devices
- App manifest configured
- 192px and 512px icons generated

## 🔄 Development Workflow

### Hot Reload During Development
The app is configured to load from the Lovable development server for instant updates:

```typescript
// capacitor.config.ts
server: {
  url: 'https://05880e6f-b316-4d80-95ac-ee3d333b6d78.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

**To disable hot reload for production builds:**
1. Comment out the `server` section in `capacitor.config.ts`
2. Run `npm run build`
3. Run `npx cap sync`

### After Making Code Changes
```bash
# 1. Pull latest code from GitHub
git pull

# 2. Sync with native platforms
npx cap sync

# 3. Rebuild if needed
npm run build
npx cap sync
```

## 🔐 Permissions Required

### iOS (Info.plist)
The following permissions are automatically configured:
- `NSCameraUsageDescription`: "We need camera access to scan receipts"
- `NSPhotoLibraryUsageDescription`: "We need photo library access to select receipts"

### Android (AndroidManifest.xml)
- `CAMERA`: Camera access for receipt scanning
- `READ_EXTERNAL_STORAGE`: Access photo library
- `POST_NOTIFICATIONS`: Push notification support (Android 13+)

## 🧪 Testing Native Features

### Test Camera Functionality
1. Navigate to `/native-features` in your app
2. Click "Take Photo" to use device camera
3. Or "Choose from Gallery" to select existing images

### Test Push Notifications
1. Run app on physical device (simulators have limitations)
2. Check notification permission status in Native Features page
3. Device token will display when successfully registered
4. Test notifications from your backend server

## 📦 Production Build

### iOS App Store
1. Open Xcode: `npx cap open ios`
2. Select "Generic iOS Device" or your device
3. Product → Archive
4. Follow App Store Connect upload process

### Google Play Store
1. Open Android Studio: `npx cap open android`
2. Build → Generate Signed Bundle/APK
3. Follow Google Play Console upload process

## 🛠 Troubleshooting

### Camera not working
- Check device permissions in Settings
- Ensure you're testing on physical device (not browser)
- Verify `@capacitor/camera` is installed

### Push notifications not registering
- Push notifications only work on physical devices
- iOS requires Apple Developer Program membership
- Android requires Firebase Cloud Messaging setup

### App not updating
- Run `npx cap sync` after code changes
- Clear app data and reinstall
- Check that `npm run build` completed successfully

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Camera Plugin](https://capacitorjs.com/docs/apis/camera)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Store Policies](https://play.google.com/about/developer-content-policy/)

## 🎯 Next Steps

1. **Configure Push Notification Backend**: Set up Firebase Cloud Messaging (Android) and Apple Push Notification Service (iOS)
2. **Add App Icons**: Replace default icons in native projects
3. **Configure Splash Screen**: Customize the launch screen
4. **Add Deep Linking**: Enable direct navigation from notifications
5. **Implement Background Sync**: Queue offline actions for later sync

For detailed blog post and setup guide, visit: https://docs.lovable.dev/
