import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AppErrorFallback, ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/i18n';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Pages that require a signed-in user, and those that additionally require the admin role.
const AUTH_REQUIRED_PAGES = ['Results'];
const ADMIN_PAGES = ['AdminExperiments', 'AdminExperimentForm'];

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const FullScreenSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const ProfileLoadErrorFallback = ({ onRetry }) => {
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

const ProtectedRoute = ({ pageName, children }) => {
  const { isAuthenticated, isAdmin, isLoadingAuth, user, authError, refreshUser } = useAuth();
  const location = useLocation();
  const needsAuth = AUTH_REQUIRED_PAGES.includes(pageName) || ADMIN_PAGES.includes(pageName);

  if (!needsAuth) return children;
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
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={
      <LayoutWrapper currentPageName={mainPageKey}>
        <MainPage />
      </LayoutWrapper>
    } />
    {Object.entries(Pages).map(([path, Page]) => (
      <Route
        key={path}
        path={`/${path}`}
        element={
          <ProtectedRoute pageName={path}>
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />
    ))}
    <Route path="*" element={
      <LayoutWrapper currentPageName="PageNotFound">
        <PageNotFound />
      </LayoutWrapper>
    } />
  </Routes>
);


function App() {

  return (
    <ErrorBoundary fallback={() => <AppErrorFallback />}>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </Router>
        <SonnerToaster position="top-center" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
