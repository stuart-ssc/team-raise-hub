import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ActiveGroupProvider } from "@/contexts/ActiveGroupContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import Users from "./pages/Users";
import Campaigns from "./pages/Campaigns";
import CampaignLanding from "./pages/CampaignLanding";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Profile from "./pages/Profile";
import NotificationHistory from "./pages/NotificationHistory";
import Reports from "./pages/Reports";
import Donors from "./pages/Donors";
import DonorProfile from "./pages/DonorProfile";
import DonorReceiptPortal from "./pages/DonorReceiptPortal";
import ThankYouTemplates from "./pages/ThankYouTemplates";
import NotFound from "./pages/NotFound";
import SystemAdminDashboard from "./pages/SystemAdmin/Dashboard";
import OrganizationsList from "./pages/SystemAdmin/OrganizationsList";
import VerificationQueue from "./pages/SystemAdmin/VerificationQueue";
import EmailManagement from "./pages/SystemAdmin/EmailManagement";
import ABTestManagement from "./pages/SystemAdmin/ABTestManagement";
import DonorSegmentation from "./pages/DonorSegmentation";
import DonorAnalytics from "./pages/DonorAnalytics";
import NurtureCampaigns from "./pages/NurtureCampaigns";
import OutreachQueue from "./pages/OutreachQueue";
import InstallApp from "./pages/InstallApp";
import NativeFeatures from "./pages/NativeFeatures";
import OrderDetails from "./pages/OrderDetails";
import MyOrders from "./pages/MyOrders";
import Businesses from "./pages/Businesses";
import BusinessProfile from "./pages/BusinessProfile";
import { SystemAdminGuard } from "./components/SystemAdminGuard";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

const AppContent = () => {
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    return <ActiveGroupProvider>{children}</ActiveGroupProvider>;
  };

  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    if (user) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/install" element={<InstallApp />} />
        <Route path="/native-features" element={<ProtectedRoute><NativeFeatures /></ProtectedRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/c/:slug" element={<CampaignLanding />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/donor-receipts" element={<DonorReceiptPortal />} />
        <Route path="/orders/:orderId" element={<OrderDetails />} />
        <Route path="/dashboard/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/dashboard/orders/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/dashboard/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/dashboard/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
        <Route path="/dashboard/donors" element={<ProtectedRoute><Donors /></ProtectedRoute>} />
        <Route path="/dashboard/donors/:donorId" element={<ProtectedRoute><DonorProfile /></ProtectedRoute>} />
        <Route path="/dashboard/donors/analytics" element={<ProtectedRoute><DonorAnalytics /></ProtectedRoute>} />
        <Route path="/dashboard/donors/templates" element={<ProtectedRoute><ThankYouTemplates /></ProtectedRoute>} />
        <Route path="/dashboard/donors/segmentation" element={<ProtectedRoute><DonorSegmentation /></ProtectedRoute>} />
        <Route path="/dashboard/donors/nurture" element={<ProtectedRoute><NurtureCampaigns /></ProtectedRoute>} />
        <Route path="/dashboard/donors/outreach-queue" element={<ProtectedRoute><OutreachQueue /></ProtectedRoute>} />
        <Route path="/dashboard/businesses" element={<ProtectedRoute><Businesses /></ProtectedRoute>} />
        <Route path="/dashboard/businesses/:businessId" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationHistory /></ProtectedRoute>} />
        <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/system-admin" element={<ProtectedRoute><SystemAdminGuard><SystemAdminDashboard /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/organizations" element={<ProtectedRoute><SystemAdminGuard><OrganizationsList /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/verification" element={<ProtectedRoute><SystemAdminGuard><VerificationQueue /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/emails" element={<ProtectedRoute><SystemAdminGuard><EmailManagement /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/ab-tests" element={<ProtectedRoute><SystemAdminGuard><ABTestManagement /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
