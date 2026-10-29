import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import { AuthLayout } from './layouts/AuthLayout';
import { AppShell } from './layouts/AppShell';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import { OnboardingRoute } from './routes/OnboardingRoute';
import { useAuthStore } from './store/useAuthStore';

// Lazy-loaded Page Modules
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const AcceptInvitePage = lazy(() =>
  import('./pages/AcceptInvitePage').then((m) => ({ default: m.AcceptInvitePage }))
);
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);
const AdminOrganizationsPage = lazy(() =>
  import('./pages/AdminOrganizationsPage').then((m) => ({ default: m.AdminOrganizationsPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectEditorPage = lazy(() =>
  import('./pages/ProjectEditorPage').then((m) => ({ default: m.ProjectEditorPage }))
);
const MediaLibraryPage = lazy(() =>
  import('./pages/MediaLibraryPage').then((m) => ({ default: m.MediaLibraryPage }))
);
const CreativeStudioPage = lazy(() =>
  import('./pages/CreativeStudioPage').then((m) => ({ default: m.CreativeStudioPage }))
);
const CaptionStudioPage = lazy(() =>
  import('./pages/CaptionStudioPage').then((m) => ({ default: m.CaptionStudioPage }))
);
const BrandProfilePage = lazy(() =>
  import('./pages/BrandProfilePage').then((m) => ({ default: m.BrandProfilePage }))
);
const AudiencePage = lazy(() =>
  import('./pages/AudiencePage').then((m) => ({ default: m.AudiencePage }))
);
const BudgetPage = lazy(() =>
  import('./pages/BudgetPage').then((m) => ({ default: m.BudgetPage }))
);
const CalendarPage = lazy(() =>
  import('./pages/CalendarPage').then((m) => ({ default: m.CalendarPage }))
);
const PlanReviewPage = lazy(() =>
  import('./pages/PlanReviewPage').then((m) => ({ default: m.PlanReviewPage }))
);
const ApprovalsQueuePage = lazy(() =>
  import('./pages/ApprovalsQueuePage').then((m) => ({ default: m.ApprovalsQueuePage }))
);
const PublishingLogPage = lazy(() =>
  import('./pages/PublishingLogPage').then((m) => ({ default: m.PublishingLogPage }))
);
const MetaConnectionsPage = lazy(() =>
  import('./pages/MetaConnectionsPage').then((m) => ({ default: m.MetaConnectionsPage }))
);
const CampaignsPage = lazy(() =>
  import('./pages/CampaignsPage').then((m) => ({ default: m.CampaignsPage }))
);
const LeadsPage = lazy(() =>
  import('./pages/LeadsPage').then((m) => ({ default: m.LeadsPage }))
);
const ConversationsPage = lazy(() =>
  import('./pages/ConversationsPage').then((m) => ({ default: m.ConversationsPage }))
);
const AppointmentsPage = lazy(() =>
  import('./pages/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage }))
);
const TeamPage = lazy(() =>
  import('./pages/TeamPage').then((m) => ({ default: m.TeamPage }))
);
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full">
      <div className="flex flex-col items-center space-y-2">
        <div className="w-5 h-5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
        <span className="text-[12px] text-[#737373]">
          Loading...
        </span>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.isPlatformAdmin || user?.role === 'platform_admin') {
    return <Navigate to="/admin/organizations" replace />;
  }
  if (user?.onboardingStatus && user.onboardingStatus !== 'completed') {
    return <Navigate to="/onboarding" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Transparently restores active session on application boot
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Dynamic root route redirect based on session role & onboarding status */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
                <Route path="/accept-invite/*" element={<AcceptInvitePage />} />
                <Route path="/invitations/:token/accept" element={<AcceptInvitePage />} />
                <Route path="/invitations/*" element={<AcceptInvitePage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Client Onboarding Route (Client Only, Stepper 1-4 & Final) */}
              <Route
                path="/onboarding"
                element={
                  <OnboardingRoute>
                    <OnboardingPage />
                  </OnboardingRoute>
                }
              />

              {/* Platform Admin Console Routes (platform_admin Only) */}
              <Route
                element={
                  <AdminRoute>
                    <AppShell />
                  </AdminRoute>
                }
              >
                <Route path="/admin/organizations" element={<AdminOrganizationsPage />} />
                <Route path="/admin" element={<Navigate to="/admin/organizations" replace />} />
              </Route>

              {/* Protected Workspace Console Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
                <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/catalog" element={<Navigate to="/projects" replace />} />
                <Route path="/projects/new" element={<ProjectEditorPage />} />
                <Route path="/projects/:id" element={<ProjectEditorPage />} />
                <Route path="/projects/:id/edit" element={<ProjectEditorPage />} />
                <Route path="/properties" element={<Navigate to="/projects" replace />} />
                <Route path="/assets" element={<MediaLibraryPage />} />
                <Route path="/media" element={<Navigate to="/assets" replace />} />
                <Route path="/studio" element={<CreativeStudioPage />} />
                <Route path="/creative-studio" element={<Navigate to="/studio" replace />} />
                <Route path="/creation" element={<Navigate to="/studio" replace />} />
                <Route path="/captions" element={<CaptionStudioPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/planner" element={<Navigate to="/calendar" replace />} />
                <Route path="/plan-review" element={<PlanReviewPage />} />
                <Route path="/approvals" element={<ApprovalsQueuePage />} />
                <Route path="/publishing" element={<PublishingLogPage />} />
                <Route path="/connections" element={<MetaConnectionsPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/ads" element={<Navigate to="/campaigns" replace />} />
                <Route path="/branding" element={<BrandProfilePage />} />
                <Route path="/audience" element={<AudiencePage />} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/crm" element={<Navigate to="/leads" replace />} />
                <Route path="/conversations" element={<ConversationsPage />} />
                <Route path="/whatsapp" element={<ConversationsPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<Navigate to="/settings" replace />} />
              </Route>

              {/* 404 Catch-All Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
