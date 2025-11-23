import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Camera, Smartphone, CheckCircle2, XCircle } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useCamera } from "@/hooks/useCamera";
import ReceiptScanner from "@/components/ReceiptScanner";
import DashboardPageLayout from "@/components/DashboardPageLayout";

const NativeFeatures = () => {
  const { token, isSupported: pushSupported } = usePushNotifications();
  const { checkPermissions } = useCamera();

  useEffect(() => {
    checkPermissions();
  }, []);

  const features = [
    {
      icon: Camera,
      title: "Camera Access",
      description: "Scan receipts and capture images directly from your device camera",
      supported: true,
      status: "Active"
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Receive real-time alerts for donations, campaign milestones, and updates",
      supported: pushSupported,
      status: pushSupported ? (token ? "Enabled" : "Available") : "Native Only"
    },
    {
      icon: Smartphone,
      title: "Native Performance",
      description: "Fast, responsive interface optimized for mobile devices",
      supported: true,
      status: "Active"
    }
  ];

  return (
    <DashboardPageLayout
      segments={[
        { label: "Dashboard", path: "/dashboard" },
        { label: "Native Features" }
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Native Features</h1>
          <p className="text-muted-foreground mt-2">
            Access device capabilities for an enhanced mobile experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  {feature.supported ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant={feature.supported ? "default" : "secondary"}>
                  {feature.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ReceiptScanner 
            onImageCaptured={(imageData) => {
              console.log('Receipt captured:', imageData.substring(0, 50) + '...');
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Push Notification Status</CardTitle>
              <CardDescription>
                Configure notification preferences for your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pushSupported ? (
                <>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={token ? "default" : "secondary"}>
                      {token ? "Registered" : "Not Registered"}
                    </Badge>
                  </div>
                  
                  {token && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Device Token</span>
                      <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded break-all">
                        {token.substring(0, 40)}...
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      You'll receive notifications for:
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        New donations to your campaigns
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Campaign milestone achievements
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Important system updates
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Native App Required</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Push notifications are only available in the native mobile app
                  </p>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/install'}>
                    Install Native App
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Running on Native?</CardTitle>
            <CardDescription>
              To access all native features, install the Sponsorly app from the App Store or Play Store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>Current Setup Instructions:</strong>
            </p>
            <ol className="text-sm space-y-2 ml-4 list-decimal">
              <li>Export this project to your GitHub repository</li>
              <li>Clone the repository to your local machine</li>
              <li>Run <code className="bg-background px-1.5 py-0.5 rounded text-xs">npm install</code></li>
              <li>Add iOS: <code className="bg-background px-1.5 py-0.5 rounded text-xs">npx cap add ios</code></li>
              <li>Add Android: <code className="bg-background px-1.5 py-0.5 rounded text-xs">npx cap add android</code></li>
              <li>Run <code className="bg-background px-1.5 py-0.5 rounded text-xs">npm run build</code></li>
              <li>Sync: <code className="bg-background px-1.5 py-0.5 rounded text-xs">npx cap sync</code></li>
              <li>Open in Xcode/Android Studio: <code className="bg-background px-1.5 py-0.5 rounded text-xs">npx cap open ios</code> or <code className="bg-background px-1.5 py-0.5 rounded text-xs">npx cap open android</code></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
};

export default NativeFeatures;
