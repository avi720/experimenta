import { useLocation } from "react-router-dom";
import { AlertTriangle, RefreshCw } from "lucide-react";
import AppHeader from "./components/layout/AppHeader";
import AppFooter from "./components/layout/AppFooter";
import AppLoadingSpinner from "./components/layout/AppLoadingSpinner";
import { ErrorBoundary, PageErrorFallback } from "./components/layout/ErrorBoundary";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "./lib/AuthContext";
import { FULL_SCREEN_PAGES } from "@/routes";
import { useTranslation } from "@/i18n";
import type { ReactNode } from "react";
import type { ErrorFallbackProps } from "@/types/props";

export default function Layout({ children, currentPageName }: { children: ReactNode; currentPageName: string }) {
  const location = useLocation();
  const { authError, refreshUser } = useAuth();
  const {
    settings,
    user,
    experiments,
    isLoading,
    isRTL,
    handleLogout,
    handleLanguageChange
  } = useAppData();
  const { t, dir } = useTranslation(isRTL);

  if (isLoading) {
    return <AppLoadingSpinner />;
  }

  const profileErrorBanner = authError?.type === 'profile_load_failed' && (
    <div className="max-w-7xl mx-auto px-4 pt-4" dir={dir}>
      <Alert variant="destructive" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <AlertTitle>
              {t('errors.profileLoadFailedTitle')}
            </AlertTitle>
            <AlertDescription>
              {t('errors.profileLoadBannerDescription')}
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshUser}
          className="self-start sm:self-center gap-2 bg-white text-slate-900 hover:bg-slate-100"
        >
          <RefreshCw className="w-4 h-4" />
          {t('common.tryAgain')}
        </Button>
      </Alert>
    </div>
  );

  // The standard site chrome: header, main content, footer.
  const withSiteChrome = (content: ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50" dir={dir}>
      <AppHeader
        isRTL={isRTL}
        user={user}
        settings={settings}
        experiments={experiments}
        location={location}
        handleLogout={handleLogout}
        handleLanguageChange={handleLanguageChange}
      />

      {profileErrorBanner}

      <main className="flex-1">
        {content}
      </main>

      <AppFooter isRTL={isRTL} currentPageName={currentPageName} />
    </div>
  );

  const pageErrorFallback = ({ reset }: ErrorFallbackProps) => <PageErrorFallback isRTL={isRTL} reset={reset} />;

  // On specific pages, render only children without the main layout wrapper
  if (FULL_SCREEN_PAGES.includes(currentPageName)) {
    // These pages have no site header of their own once they crash, so the
    // error fallback is shown inside the standard chrome to keep navigation usable.
    return (
      <ErrorBoundary
        resetKey={location.pathname}
        fallback={(props: ErrorFallbackProps) => withSiteChrome(pageErrorFallback(props))}
      >
        <main className="h-screen bg-slate-50">
          {profileErrorBanner}
          {children}
        </main>
      </ErrorBoundary>
    );
  }

  return withSiteChrome(
    <ErrorBoundary resetKey={location.pathname} fallback={pageErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
