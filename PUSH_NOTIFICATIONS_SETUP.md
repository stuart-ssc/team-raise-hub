# Push Notifications Setup Guide

Complete guide to configure Firebase Cloud Messaging (FCM) for Android and Apple Push Notification Service (APNS) for iOS.

## 📋 Prerequisites

- Firebase account
- Apple Developer Account ($99/year - for iOS only)
- Xcode (for iOS development)
- Android Studio (for Android development)

## 🔥 Firebase Cloud Messaging Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or select existing project
3. Enter project name (e.g., "Sponsorly")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 2. Add Android App to Firebase

1. In Firebase Console, click "Add app" → Android icon
2. Enter Android package name: `app.lovable.05880e6fb3164d8095acee3d333b6d78`
3. Download `google-services.json`
4. Place file in: `android/app/google-services.json`
5. Click "Next" through the setup wizard

### 3. Add iOS App to Firebase

1. In Firebase Console, click "Add app" → iOS icon
2. Enter iOS bundle ID: `app.lovable.05880e6fb3164d8095acee3d333b6d78`
3. Download `GoogleService-Info.plist`
4. Open Xcode: `npx cap open ios`
5. Drag `GoogleService-Info.plist` into Xcode project root
6. Ensure "Copy items if needed" is checked
7. Click "Next" through the setup wizard

### 4. Get FCM Server Key

1. In Firebase Console → Project Settings → Cloud Messaging
2. Under "Cloud Messaging API (Legacy)", copy the **Server key**
3. Save this key - you'll add it to Supabase secrets

**Important:** If you don't see Server key:
- Click on the three dots next to "Cloud Messaging API (Legacy)"
- Enable "Cloud Messaging API (Legacy)"

## 🍎 Apple Push Notification Service (APNS) Setup

### 1. Enable Push Notifications in Xcode

1. Open project in Xcode: `npx cap open ios`
2. Select your app target in left sidebar
3. Click "Signing & Capabilities" tab
4. Click "+ Capability" button
5. Add "Push Notifications"
6. Add "Background Modes"
7. Check "Remote notifications" under Background Modes

### 2. Create APNS Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to Certificates, Identifiers & Profiles
3. Click Identifiers → Select your App ID
4. Check "Push Notifications" capability
5. Click "Configure" for Push Notifications

#### Development Certificate:
1. Click "Create Certificate" under Development SSL Certificate
2. Follow instructions to create Certificate Signing Request (CSR)
3. Upload CSR and download certificate
4. Double-click to install in Keychain Access

#### Production Certificate:
1. Click "Create Certificate" under Production SSL Certificate
2. Follow same CSR process
3. Upload and download certificate
4. Install in Keychain Access

### 3. Upload APNS Certificate to Firebase

1. In Firebase Console → Project Settings → Cloud Messaging
2. Under "Apple app configuration", click "Upload"
3. In Keychain Access:
   - Find your certificate
   - Right-click → Export
   - Save as .p12 file with password
4. Upload .p12 file to Firebase
5. Enter password used during export

### 4. Configure Xcode Signing

1. In Xcode, select your target
2. Go to "Signing & Capabilities"
3. Select your Team
4. Ensure "Automatically manage signing" is checked
5. Verify Push Notifications entitlement is present

## 🔐 Configure Supabase Secrets

You need to add the FCM Server Key to Supabase so edge functions can send notifications.

### Add FCM_SERVER_KEY Secret

The FCM Server Key will be added as a secret in Supabase. This allows the edge functions to authenticate with Firebase when sending push notifications.

**Secret Name:** `FCM_SERVER_KEY`
**Secret Value:** Your Firebase Cloud Messaging Server Key (from Firebase Console)

I'll prepare the button for you to add this secret securely.

## 📊 Database Schema

Create tables to store device tokens and notification logs:

```sql
-- Push notification device tokens
CREATE TABLE push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_info JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, device_token)
);

-- Enable RLS
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view own tokens"
  ON push_notification_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Push notification log
CREATE TABLE push_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  tokens_sent INTEGER,
  success_count INTEGER,
  failure_count INTEGER,
  fcm_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view notification logs"
  ON push_notification_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.system_admin = true
    )
  );

-- Create indexes
CREATE INDEX idx_push_tokens_user ON push_notification_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_notification_tokens(active);
CREATE INDEX idx_push_log_created ON push_notification_log(created_at DESC);
```

## 🧪 Testing Push Notifications

### Test on Physical Device (Required)

Push notifications **do not work on simulators/emulators**. You must test on:
- Real iPhone (for iOS)
- Real Android phone (for Android)

### Testing Steps

1. **Build and deploy app to device:**
   ```bash
   npm run build
   npx cap sync
   npx cap open ios    # or android
   ```

2. **Run app on physical device** from Xcode/Android Studio

3. **Grant notification permissions** when prompted

4. **Check device token registration:**
   - Open app
   - Navigate to `/native-features`
   - Verify device token displays
   - Check Supabase `push_notification_tokens` table

5. **Send test notification from Supabase:**
   ```bash
   # Call edge function with test payload
   curl -X POST 'YOUR_SUPABASE_URL/functions/v1/send-push-notification' \\
     -H 'Authorization: Bearer YOUR_ANON_KEY' \\
     -H 'Content-Type: application/json' \\
     -d '{
       "title": "Test Notification",
       "body": "This is a test from Supabase",
       "userId": "YOUR_USER_ID"
     }'
   ```

### Test Donation Notifications

When a new donation/order is created, automatically send notification:

1. Create database trigger or call from application:
   ```typescript
   // After successful donation
   await supabase.functions.invoke('send-donation-notification', {
     body: {
       orderId: order.id,
       campaignId: campaign.id,
       amount: order.total_amount,
       donorName: order.customer_name
     }
   });
   ```

## 📱 Native App Configuration

### Android Configuration

Edit `android/app/build.gradle`:
```gradle
dependencies {
    // ... other dependencies
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

Edit `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        // ... other dependencies
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Edit `android/app/build.gradle` (bottom of file):
```gradle
apply plugin: 'com.google.gms.google-services'
```

### iOS Configuration

Edit `ios/App/App/AppDelegate.swift`:
```swift
import UIKit
import Capacitor
import Firebase

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure Firebase
        FirebaseApp.configure()
        
        // Request notification permissions
        UNUserNotificationCenter.current().delegate = self
        
        return true
    }
    
    // ... rest of AppDelegate
}

extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([[.banner, .sound]])
    }
}
```

## 🔍 Troubleshooting

### Android Issues

**Problem:** Notifications not received
- Verify `google-services.json` is in correct location
- Check Firebase Console for valid Server Key
- Ensure app package name matches Firebase registration
- Check Android notification settings (battery optimization)

**Problem:** FCM token not generated
- Enable Google Play Services on device
- Check Firebase dependencies in `build.gradle`
- Review Android logcat for errors

### iOS Issues

**Problem:** Notifications not received
- Verify APNS certificate uploaded to Firebase
- Check Push Notifications capability enabled in Xcode
- Ensure device has internet connection
- Check iOS notification settings

**Problem:** APNS registration failed
- Verify Bundle ID matches Apple Developer Portal
- Check provisioning profile includes Push Notifications
- Ensure APNS certificate is valid (not expired)
- Test on physical device (simulators don't support push)

**Problem:** "No APNS token" error
- Remove and reinstall app
- Check device notification permissions
- Verify internet connectivity
- Review Xcode console for errors

### General Debugging

1. **Check device token registration:**
   ```sql
   SELECT * FROM push_notification_tokens 
   WHERE user_id = 'YOUR_USER_ID';
   ```

2. **View notification logs:**
   ```sql
   SELECT * FROM push_notification_log 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Test FCM directly:**
   Use [Firebase Console → Cloud Messaging → Send test message](https://console.firebase.google.com/)

4. **Check edge function logs:**
   - Go to Supabase Dashboard → Edge Functions
   - Select function and view logs

## 🚀 Production Checklist

- [ ] Firebase project created and configured
- [ ] Android app registered with FCM
- [ ] iOS app registered with Firebase
- [ ] APNS certificates uploaded to Firebase
- [ ] FCM_SERVER_KEY added to Supabase secrets
- [ ] Database tables created
- [ ] Edge functions deployed
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] Notification permissions working
- [ ] Device tokens saving to database
- [ ] Test notifications received successfully
- [ ] Donation notifications working
- [ ] Background notifications working

## 📚 Additional Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [APNS Documentation](https://developer.apple.com/documentation/usernotifications)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)

## 💡 Next Steps

1. **Add more notification types:**
   - Campaign milestones (50%, 75%, 100% of goal)
   - New campaign published
   - Receipt generation complete
   - Important updates from admins

2. **Implement notification preferences:**
   - Let users control which notifications they receive
   - Add "quiet hours" feature
   - Priority/urgency levels

3. **Analytics and monitoring:**
   - Track notification delivery rates
   - Monitor click-through rates
   - A/B test notification content

4. **Advanced features:**
   - Rich media notifications (images, actions)
   - Scheduled notifications
   - Geolocation-based notifications
   - Deep linking from notifications
