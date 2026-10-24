import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AppErrorFallback, ErrorBoundary } from '@/components/layout/ErrorBoundary';

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

const ProtectedRoute = ({ pageName, children }) => {
  const { isAuthenticated, isAdmin, isLoadingAuth, user } = useAuth();
  const location = useLocation();
  const needsAuth = AUTH_REQUIRED_PAGES.includes(pageName) || ADMIN_PAGES.includes(pageName);

  if (!needsAuth) return children;
  if (isLoadingAuth || (isAuthenticated && !user)) return <FullScreenSpinner />;
  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/Login?redirect=${redirect}`} replace />;
  }
  if (ADMIN_PAGES.includes(pageName) && !isAdmin) {
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
    <Route path="*" element={<PageNotFound />} />
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
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
