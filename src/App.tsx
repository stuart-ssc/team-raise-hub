import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from 'react-helmet-async';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ActiveGroupProvider } from "@/contexts/ActiveGroupContext";
import Index from "./pages/Index";
import Platform from "./pages/Platform";
import Schools from "./pages/Schools";
import Nonprofits from "./pages/Nonprofits";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataProcessingAgreement from "./pages/DataProcessingAgreement";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import Users from "./pages/Users";
import Campaigns from "./pages/Campaigns";
import CampaignEditor from "./pages/CampaignEditor";
import CampaignLanding from "./pages/CampaignLanding";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Profile from "./pages/Profile";
import NotificationHistory from "./pages/NotificationHistory";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import Reports from "./pages/Reports";
import Donors from "./pages/Donors";
import DonorProfile from "./pages/DonorProfile";
import DonorReceiptPortal from "./pages/DonorReceiptPortal";
import ThankYouTemplates from "./pages/ThankYouTemplates";
import NotFound from "./pages/NotFound";
import SystemAdminDashboard from "./pages/SystemAdmin/Dashboard";
import OrganizationsList from "./pages/SystemAdmin/OrganizationsList";
import OrganizationDetail from "./pages/SystemAdmin/OrganizationDetail";
import BusinessesList from "./pages/SystemAdmin/BusinessesList";
import BusinessDetail from "./pages/SystemAdmin/BusinessDetail";
import VerificationQueue from "./pages/SystemAdmin/VerificationQueue";
import EmailManagement from "./pages/SystemAdmin/EmailManagement";
import ABTestManagement from "./pages/SystemAdmin/ABTestManagement";
import SystemAdminReports from "./pages/SystemAdmin/Reports";
import SchoolImport from "./pages/SystemAdmin/SchoolImport";
import LandingPages from "./pages/SystemAdmin/LandingPages";
import MarketingAnalytics from "./pages/SystemAdmin/MarketingAnalytics";
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
import BusinessAnalytics from "./pages/BusinessAnalytics";
import BusinessOutreachQueue from "./pages/BusinessOutreachQueue";
import BusinessNurtureCampaigns from "./pages/BusinessNurtureCampaigns";
import BusinessCampaignAnalytics from "./pages/BusinessCampaignAnalytics";
import MyFundraising from "./pages/MyFundraising";
import OrganizationSettings from "./pages/OrganizationSettings";
import Contact from "./pages/Contact";
import ContactSubmissions from "./pages/SystemAdmin/ContactSubmissions";
import { SystemAdminGuard } from "./components/SystemAdminGuard";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { HubSpotTracker } from "./components/HubSpotTracker";
import { GoogleAnalyticsTracker } from "./components/GoogleAnalyticsTracker";
import { RB2BTracker } from "./components/RB2BTracker";
import { CookieYesTracker } from "./components/CookieYesTracker";
import ScrollToTop from "./components/ScrollToTop";
import StateLandingPage from "./pages/StateLandingPage";
import SchoolLandingPage from "./pages/SchoolLandingPage";
import DistrictLandingPage from "./pages/DistrictLandingPage";

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
      <ScrollToTop />
      <CookieYesTracker />
      <HubSpotTracker />
      <GoogleAnalyticsTracker />
      <RB2BTracker />
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/schools" element={<Schools />} />
        <Route path="/schools/:state" element={<StateLandingPage />} />
        <Route path="/nonprofits" element={<Nonprofits />} />
        <Route path="/platform" element={<Platform />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/dpa" element={<DataProcessingAgreement />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/install" element={<InstallApp />} />
        <Route path="/native-features" element={<ProtectedRoute><NativeFeatures /></ProtectedRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/c/:slug" element={<CampaignLanding />} />
        <Route path="/c/:slug/:rosterMemberSlug" element={<CampaignLanding />} />
        <Route path="/schools/:state/:slug" element={<SchoolLandingPage />} />
        <Route path="/districts/:state/:slug" element={<DistrictLandingPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/donor-receipts" element={<DonorReceiptPortal />} />
        <Route path="/orders/:orderId" element={<OrderDetails />} />
        <Route path="/dashboard/orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/dashboard/orders/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/dashboard/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/dashboard/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
        <Route path="/dashboard/campaigns/new" element={<ProtectedRoute><CampaignEditor /></ProtectedRoute>} />
        <Route path="/dashboard/campaigns/:id/edit" element={<ProtectedRoute><CampaignEditor /></ProtectedRoute>} />
        <Route path="/dashboard/donors" element={<ProtectedRoute><Donors /></ProtectedRoute>} />
        <Route path="/dashboard/donors/:donorId" element={<ProtectedRoute><DonorProfile /></ProtectedRoute>} />
        <Route path="/dashboard/donors/analytics" element={<ProtectedRoute><DonorAnalytics /></ProtectedRoute>} />
        <Route path="/dashboard/donors/templates" element={<ProtectedRoute><ThankYouTemplates /></ProtectedRoute>} />
        <Route path="/dashboard/donors/segmentation" element={<ProtectedRoute><DonorSegmentation /></ProtectedRoute>} />
        <Route path="/dashboard/donors/nurture" element={<ProtectedRoute><NurtureCampaigns /></ProtectedRoute>} />
        <Route path="/dashboard/donors/outreach-queue" element={<ProtectedRoute><OutreachQueue /></ProtectedRoute>} />
        <Route path="/dashboard/businesses" element={<ProtectedRoute><Businesses /></ProtectedRoute>} />
        <Route path="/dashboard/businesses/outreach-queue" element={<ProtectedRoute><BusinessOutreachQueue /></ProtectedRoute>} />
        <Route path="/dashboard/businesses/nurture" element={<ProtectedRoute><BusinessNurtureCampaigns /></ProtectedRoute>} />
        <Route path="/dashboard/businesses/campaign-analytics" element={<ProtectedRoute><BusinessCampaignAnalytics /></ProtectedRoute>} />
        <Route path="/dashboard/businesses/:businessId" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
        <Route path="/dashboard/businesses/analytics" element={<ProtectedRoute><BusinessAnalytics /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><OrganizationSettings /></ProtectedRoute>} />
        <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationHistory /></ProtectedRoute>} />
        <Route path="/dashboard/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/dashboard/messages/:id" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
        <Route path="/dashboard/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/dashboard/my-fundraising" element={<ProtectedRoute><MyFundraising /></ProtectedRoute>} />
        <Route path="/system-admin" element={<ProtectedRoute><SystemAdminGuard><SystemAdminDashboard /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/organizations" element={<ProtectedRoute><SystemAdminGuard><OrganizationsList /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/organizations/:orgId" element={<ProtectedRoute><SystemAdminGuard><OrganizationDetail /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/businesses" element={<ProtectedRoute><SystemAdminGuard><BusinessesList /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/businesses/:businessId" element={<ProtectedRoute><SystemAdminGuard><BusinessDetail /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/school-import" element={<ProtectedRoute><SystemAdminGuard><SchoolImport /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/landing-pages" element={<ProtectedRoute><SystemAdminGuard><LandingPages /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/verification" element={<ProtectedRoute><SystemAdminGuard><VerificationQueue /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/emails" element={<ProtectedRoute><SystemAdminGuard><EmailManagement /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/ab-tests" element={<ProtectedRoute><SystemAdminGuard><ABTestManagement /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/reports" element={<ProtectedRoute><SystemAdminGuard><SystemAdminReports /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/marketing-analytics" element={<ProtectedRoute><SystemAdminGuard><MarketingAnalytics /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="/system-admin/contact-submissions" element={<ProtectedRoute><SystemAdminGuard><ContactSubmissions /></SystemAdminGuard></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </HelmetProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
