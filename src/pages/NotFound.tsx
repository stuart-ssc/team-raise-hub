import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import MarketingHeader from "@/components/MarketingHeader";
import { Home, Compass, HelpCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      
      <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
        <div className="text-center max-w-md space-y-8">
          <div className="space-y-4">
            <h1 
              className="font-bold leading-none"
              style={{ 
                fontFamily: "'Nexa Script', 'Pacifico', cursive",
                fontSize: 'clamp(8rem, 20vw, 14rem)'
              }}
            >
              <span style={{ color: '#1c6dbe' }}>4</span>
              <span style={{ color: '#2AA87E' }}>0</span>
              <span style={{ color: '#1c6dbe' }}>4</span>
            </h1>
            <h2 className="text-2xl font-semibold text-foreground">
              Oops! This page took a detour
            </h2>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved. Let's get you back on track.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/features">
                <Compass className="mr-2 h-4 w-4" />
                Explore Features
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/contact">
                <HelpCircle className="mr-2 h-4 w-4" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
