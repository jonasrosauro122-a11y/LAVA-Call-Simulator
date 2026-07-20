import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AssessmentProvider, useAssessment } from './context/AssessmentContext';
import { LearningProvider } from './learning/context/LearningContext';
import { GamificationProvider } from './learning/context/GamificationContext';
import { AnalysisProvider } from './learning/context/AnalysisContext';
import { ScenarioProvider } from './learning/context/ScenarioContext';
import { VoiceProvider } from './learning/context/VoiceContext';
import { ManagementProvider } from './enterprise/context/ManagementContext';
import { PlatformProvider } from './platform/context/PlatformContext';
import { TenantProvider } from './tenant/context/TenantProvider';
import { ProductionProvider, useProduction } from './production/context/ProductionProvider';
import { ErrorBoundary } from './production/components/ErrorBoundary';
import { OfflineBanner } from './production/components/StateViews';
import { XpToastHost } from './learning/components/XpToastHost';
import { LevelUpModal } from './learning/components/LevelUpModal';

// Route-level code splitting: each page loads on demand instead of shipping one large bundle.
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ModulePage = lazy(() => import('./pages/ModulePage').then(m => ({ default: m.ModulePage })));
const ReportPage = lazy(() => import('./pages/ReportPage').then(m => ({ default: m.ReportPage })));
const CertificatePage = lazy(() => import('./pages/CertificatePage').then(m => ({ default: m.CertificatePage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const PracticePage = lazy(() => import('./pages/PracticePage').then(m => ({ default: m.PracticePage })));

// Learning Journey (additive layer)
const LearningDashboardPage = lazy(() => import('./learning/pages/LearningDashboardPage').then(m => ({ default: m.LearningDashboardPage })));
const PathsCatalogPage = lazy(() => import('./learning/pages/PathsCatalogPage').then(m => ({ default: m.PathsCatalogPage })));
const PathOverviewPage = lazy(() => import('./learning/pages/PathOverviewPage').then(m => ({ default: m.PathOverviewPage })));
const ModuleDetailPage = lazy(() => import('./learning/pages/ModuleDetailPage').then(m => ({ default: m.ModuleDetailPage })));
const TrophyRoomPage = lazy(() => import('./learning/pages/TrophyRoomPage').then(m => ({ default: m.TrophyRoomPage })));
const LearningLeaderboardPage = lazy(() => import('./learning/pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const ProfilePage = lazy(() => import('./learning/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AnalyticsPage = lazy(() => import('./learning/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SimulationAnalysisPage = lazy(() => import('./learning/pages/SimulationAnalysisPage').then(m => ({ default: m.SimulationAnalysisPage })));
const ScenarioPreviewPage = lazy(() => import('./learning/pages/ScenarioPreviewPage').then(m => ({ default: m.ScenarioPreviewPage })));
const ScenarioHistoryPage = lazy(() => import('./learning/pages/ScenarioHistoryPage').then(m => ({ default: m.ScenarioHistoryPage })));
const AISettingsPage = lazy(() => import('./learning/pages/AISettingsPage').then(m => ({ default: m.AISettingsPage })));
const VoiceAnalyticsPage = lazy(() => import('./learning/pages/VoiceAnalyticsPage').then(m => ({ default: m.VoiceAnalyticsPage })));
const VoiceReplayPage = lazy(() => import('./learning/pages/VoiceReplayPage').then(m => ({ default: m.VoiceReplayPage })));
const TrainerDashboardPage = lazy(() => import('./enterprise/pages/TrainerDashboardPage').then(m => ({ default: m.TrainerDashboardPage })));
const LearnerManagementPage = lazy(() => import('./enterprise/pages/LearnerManagementPage').then(m => ({ default: m.LearnerManagementPage })));
const LearnerProfilePage = lazy(() => import('./enterprise/pages/LearnerProfilePage').then(m => ({ default: m.LearnerProfilePage })));
const AssignmentsPage = lazy(() => import('./enterprise/pages/AssignmentsPage').then(m => ({ default: m.AssignmentsPage })));
const CohortsPage = lazy(() => import('./enterprise/pages/CohortsPage').then(m => ({ default: m.CohortsPage })));
const TrainerAnalyticsPage = lazy(() => import('./enterprise/pages/TrainerAnalyticsPage').then(m => ({ default: m.TrainerAnalyticsPage })));
const ReportsPage = lazy(() => import('./enterprise/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('./enterprise/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const CompanyDashboardPage = lazy(() => import('./enterprise/pages/CompanyDashboardPage').then(m => ({ default: m.CompanyDashboardPage })));
const PlatformAdminPage = lazy(() => import('./platform/pages/PlatformAdminPage').then(m => ({ default: m.PlatformAdminPage })));
const TenantsAdminPage = lazy(() => import('./tenant/pages/TenantsAdminPage').then(m => ({ default: m.TenantsAdminPage })));
const TenantDashboardPage = lazy(() => import('./tenant/pages/TenantDashboardPage').then(m => ({ default: m.TenantDashboardPage })));
const OnboardingPage = lazy(() => import('./production/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const LaunchCenterPage = lazy(() => import('./production/pages/LaunchCenterPage').then(m => ({ default: m.LaunchCenterPage })));
const HealthDashboardPage = lazy(() => import('./production/pages/HealthDashboardPage').then(m => ({ default: m.HealthDashboardPage })));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-100 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-lava-500 border-t-transparent animate-spin" />
        <p className="text-sm text-ink-500">Loading…</p>
      </div>
    </div>
  );
}

function SessionRestore() {
  const { resumeAssessment } = useAssessment();
  useEffect(() => {
    const saved = localStorage.getItem('lava_assessment_session');
    if (saved) {
      try {
        const { assessmentId } = JSON.parse(saved);
        if (assessmentId) resumeAssessment(assessmentId);
      } catch { /* ignore */ }
    }
  }, [resumeAssessment]);
  return null;
}

function AppRoutes() {
  const { assessment } = useAssessment();
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={assessment ? <DashboardPage /> : <Navigate to="/" replace />} />
        <Route path="/module/:moduleNumber" element={assessment ? <ModulePage /> : <Navigate to="/" replace />} />
        <Route path="/report" element={assessment ? <ReportPage /> : <Navigate to="/" replace />} />
        <Route path="/certificate" element={assessment ? <CertificatePage /> : <Navigate to="/" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/practice" element={<PracticePage />} />

        {/* Learning Journey (additive) — gated the same way as other candidate routes */}
        <Route path="/learning" element={assessment ? <LearningDashboardPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/paths" element={assessment ? <PathsCatalogPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/path/:pathId" element={assessment ? <PathOverviewPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/module/:moduleId" element={assessment ? <ModuleDetailPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/trophies" element={assessment ? <TrophyRoomPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/leaderboard" element={assessment ? <LearningLeaderboardPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/profile" element={assessment ? <ProfilePage /> : <Navigate to="/" replace />} />
        <Route path="/learning/analytics" element={assessment ? <AnalyticsPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/simulation/:id" element={assessment ? <SimulationAnalysisPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/scenarios" element={assessment ? <ScenarioHistoryPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/scenario/:pathId/:moduleId" element={assessment ? <ScenarioPreviewPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/ai-settings" element={assessment ? <AISettingsPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/voice" element={assessment ? <VoiceAnalyticsPage /> : <Navigate to="/" replace />} />
        <Route path="/learning/voice/:simulationId" element={assessment ? <VoiceReplayPage /> : <Navigate to="/" replace />} />
        <Route path="/trainer" element={assessment ? <TrainerDashboardPage /> : <Navigate to="/" replace />} />
        <Route path="/trainer/learners" element={assessment ? <LearnerManagementPage /> : <Navigate to="/" replace />} />
        <Route path="/trainer/learner/:id" element={assessment ? <LearnerProfilePage /> : <Navigate to="/" replace />} />
        <Route path="/trainer/assignments" element={assessment ? <AssignmentsPage /> : <Navigate to="/" replace />} />
        <Route path="/trainer/cohorts" element={assessment ? <CohortsPage /> : <Navigate to="/" replace />} />
        <Route path="/trainer/analytics" element={assessment ? <TrainerAnalyticsPage /> : <Navigate to="/" replace />} />
        <Route path="/trainer/reports" element={assessment ? <ReportsPage /> : <Navigate to="/" replace />} />
        <Route path="/trainer/notifications" element={assessment ? <NotificationsPage /> : <Navigate to="/" replace />} />
        <Route path="/company" element={assessment ? <CompanyDashboardPage /> : <Navigate to="/" replace />} />
        <Route path="/admin/platform" element={assessment ? <PlatformAdminPage /> : <Navigate to="/" replace />} />
        <Route path="/admin/tenants" element={assessment ? <TenantsAdminPage /> : <Navigate to="/" replace />} />
        <Route path="/admin/tenant/:tenantId" element={assessment ? <TenantDashboardPage /> : <Navigate to="/" replace />} />
        <Route path="/onboarding" element={assessment ? <OnboardingPage /> : <Navigate to="/" replace />} />
        <Route path="/admin/launch" element={assessment ? <LaunchCenterPage /> : <Navigate to="/" replace />} />
        <Route path="/admin/health" element={assessment ? <HealthDashboardPage /> : <Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ProductionProvider>
    <ErrorBoundary scope="app">
    <PlatformProvider>
      <ThemeProvider>
        <AssessmentProvider>
        <LearningProvider>
          <GamificationProvider>
            <AnalysisProvider>
              <ScenarioProvider>
                <VoiceProvider>
                  <ManagementProvider>
                    <TenantProvider>
                    <BrowserRouter>
                      <SessionRestore />
                      <OfflineGate />
                      <AppRoutes />
                    </BrowserRouter>
                    <XpToastHost />
                    <LevelUpModal />
                    </TenantProvider>
                  </ManagementProvider>
                </VoiceProvider>
              </ScenarioProvider>
            </AnalysisProvider>
          </GamificationProvider>
        </LearningProvider>
      </AssessmentProvider>
    </ThemeProvider>
    </PlatformProvider>
    </ErrorBoundary>
    </ProductionProvider>
  );
}

// Renders the offline banner using production context (inside all providers).
function OfflineGate() {
  const { online } = useProduction();
  return <OfflineBanner online={online} />;
}
