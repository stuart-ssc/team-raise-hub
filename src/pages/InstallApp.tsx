import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Wifi, Zap, CheckCircle2 } from "lucide-react";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Smartphone,
      title: "Works Like a Native App",
      description: "Install on your home screen and access like any other app"
    },
    {
      icon: Wifi,
      title: "Offline Access",
      description: "View campaigns and donations even without internet"
    },
    {
      icon: Zap,
      title: "Fast & Responsive",
      description: "Lightning-fast loading and smooth performance"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <SponsorlyLogo variant="full" theme="light" className="h-12" />
          </div>
          
          <div>
            <CardTitle className="text-3xl mb-2">Install Sponsorly</CardTitle>
            <CardDescription className="text-base">
              Get the best fundraising experience with our progressive web app
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold">App Already Installed!</h3>
              <p className="text-muted-foreground">
                Sponsorly is already installed on your device. You can access it from your home screen.
              </p>
              <Button onClick={() => navigate('/dashboard')} size="lg" className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-2">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4">
                {deferredPrompt ? (
                  <Button 
                    onClick={handleInstall} 
                    size="lg" 
                    className="w-full"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Install Now
                  </Button>
                ) : (
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-primary" />
                        How to Install on Mobile
                      </h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><strong>iOS (Safari):</strong> Tap the Share button, then "Add to Home Screen"</p>
                        <p><strong>Android (Chrome):</strong> Tap the menu (⋮), then "Install app" or "Add to Home screen"</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline" 
                  className="w-full"
                >
                  Continue in Browser
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallApp;
