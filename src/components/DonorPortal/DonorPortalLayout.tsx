import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDonorPortal } from "@/hooks/useDonorPortal";
import { DonorPortalSidebar } from "./DonorPortalSidebar";
import { DonorPortalSidebarSheet } from "./DonorPortalSidebarSheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard } from "lucide-react";

interface DonorPortalLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function DonorPortalLayout({ children, title, subtitle }: DonorPortalLayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { linkedBusinesses, hasOrgAccess, isLoading } = useDonorPortal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const userInitials = user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "?";

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:flex flex-col w-64 bg-card border-r">
          <div className="p-6">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex-1 p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center px-4 md:px-6">
            <Skeleton className="h-8 w-48" />
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DonorPortalSidebar 
        hasBusinesses={linkedBusinesses.length > 0} 
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <DonorPortalSidebarSheet
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
              hasBusinesses={linkedBusinesses.length > 0}
              onLogout={handleLogout}
            />
            {title && (
              <div>
                <h1 className="text-lg font-semibold">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasOrgAccess && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="hidden sm:flex"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Org Dashboard
              </Button>
            )}
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
