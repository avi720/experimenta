import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import PageNotFound from './pages/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AppErrorFallback, ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation, I18nProvider } from '@/i18n';
import { LEGACY_EXPERIMENT_PAGES, ROUTES } from '@/routes';

// Every page except Dashboard is split into its own chunk (T30); App wraps routes in Suspense.
const Lab = lazy(() => import('./pages/Lab'));
const LabWorkspace = lazy(() => import('./pages/LabWorkspace'));
const AdminExperiments = lazy(() => import('./pages/AdminExperiments'));
const AdminExperimentForm = lazy(() => import('./pages/AdminExperimentForm'));
const Results = lazy(() => import('./pages/Results'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const WhatIsNew = lazy(() => import('./pages/WhatIsNew'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Login = lazy(() => import('./pages/Login'));

// Pages that require a signed-in user, and those that additionally require the admin role.
const AUTH_REQUIRED_PAGES = ['Results'];
const ADMIN_PAGES = ['AdminExperiments', 'AdminExperimentForm'];

const LayoutWrapper = ({ children, currentPageName }: { children: ReactNode; currentPageName: string }) => {
  const page = <Suspense fallback={<FullScreenSpinner />}>{children}</Suspense>;
  return <Layout currentPageName={currentPageName}>{page}</Layout>;
};

const FullScreenSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const ProfileLoadErrorFallback = ({ onRetry }: { onRetry: () => void }) => {
  const { t, dir } = useTranslation();
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4" dir={dir}>
      <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">
        {t('errors.profileLoadFailedTitle')}
      </h2>
      <p className="text-slate-600">
        {t('errors.profileLoadFailedDescription')}
      </p>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        {t('common.tryAgain')}
      </Button>
    </div>
  );
};

const ProtectedRoute = ({ pageName, children }: { pageName: string; children: ReactNode }) => {
  const { isAuthenticated, isAdmin, isLoadingAuth, user, authError, refreshUser } = useAuth();
  const location = useLocation();
  const needsAuth = AUTH_REQUIRED_PAGES.includes(pageName) || ADMIN_PAGES.includes(pageName);

  if (!needsAuth) return <>{children}</>;
  if (isLoadingAuth || (isAuthenticated && !user)) return <FullScreenSpinner />;
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/Login?redirect=${redirect}`} replace />;
  }
  if (ADMIN_PAGES.includes(pageName) && !isAdmin) {
    if (authError?.type === 'profile_load_failed') {
      return (
        <LayoutWrapper currentPageName={pageName}>
          <ProfileLoadErrorFallback onRetry={refreshUser} />
        </LayoutWrapper>
      );
    }
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Home and Dashboard */}
    <Route path="/" element={<LayoutWrapper currentPageName="Dashboard"><Dashboard /></LayoutWrapper>} />
    <Route path={ROUTES.DASHBOARD} element={<Navigate to="/" replace />} />

    {/* Lab and Workspace routes */}
    <Route path={ROUTES.LAB} element={<LayoutWrapper currentPageName="Lab"><Lab /></LayoutWrapper>} />
    <Route path={ROUTES.LAB_WORKSPACE} element={<LayoutWrapper currentPageName="LabWorkspace"><LabWorkspace /></LayoutWrapper>} />

    {/* Legacy experiment slug routes for backwards compatibility */}
    {LEGACY_EXPERIMENT_PAGES.map((pageName) => (
      <Route key={pageName} path={`/${pageName}`} element={<LayoutWrapper currentPageName={pageName}><LabWorkspace /></LayoutWrapper>} />
    ))}

    {/* Protected routes */}
    <Route path={ROUTES.RESULTS} element={
      <ProtectedRoute pageName="Results">
        <LayoutWrapper currentPageName="Results"><Results /></LayoutWrapper>
      </ProtectedRoute>
    } />
    <Route path={ROUTES.ADMIN_EXPERIMENTS} element={
      <ProtectedRoute pageName="AdminExperiments">
        <LayoutWrapper currentPageName="AdminExperiments"><AdminExperiments /></LayoutWrapper>
      </ProtectedRoute>
    } />
    <Route path={ROUTES.ADMIN_EXPERIMENT_FORM} element={
      <ProtectedRoute pageName="AdminExperimentForm">
        <LayoutWrapper currentPageName="AdminExperimentForm"><AdminExperimentForm /></LayoutWrapper>
      </ProtectedRoute>
    } />

    {/* Content and Auth pages */}
    <Route path={ROUTES.ABOUT} element={<LayoutWrapper currentPageName="AboutUs"><AboutUs /></LayoutWrapper>} />
    <Route path={ROUTES.WHAT_IS_NEW} element={<LayoutWrapper currentPageName="WhatIsNew"><WhatIsNew /></LayoutWrapper>} />
    <Route path={ROUTES.PRIVACY} element={<LayoutWrapper currentPageName="PrivacyPolicy"><PrivacyPolicy /></LayoutWrapper>} />
    <Route path={ROUTES.TERMS} element={<LayoutWrapper currentPageName="TermsOfService"><TermsOfService /></LayoutWrapper>} />
    <Route path={ROUTES.LOGIN} element={<LayoutWrapper currentPageName="Login"><Login /></LayoutWrapper>} />

    {/* 404 Catch-all */}
    <Route path="*" element={<LayoutWrapper currentPageName="PageNotFound"><PageNotFound /></LayoutWrapper>} />
  </Routes>
);

function App() {
  return (
    <ErrorBoundary fallback={() => <AppErrorFallback />}>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthProvider>
            <I18nProvider>
              <AppRoutes />
            </I18nProvider>
          </AuthProvider>
        </Router>
        <SonnerToaster position="top-center" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
