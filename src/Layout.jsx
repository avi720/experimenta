import React from "react";
import { useLocation } from "react-router-dom";
import AppHeader from "./components/layout/AppHeader";
import AppFooter from "./components/layout/AppFooter";
import AppLoadingSpinner from "./components/layout/AppLoadingSpinner";
import { ErrorBoundary, PageErrorFallback } from "./components/layout/ErrorBoundary";
import { useAppData } from "./components/hooks/useAppData";
import { FULL_SCREEN_PAGES } from "./pages.config";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const {
    settings,
    user,
    experiments,
    isLoading,
    isRTL,
    handleLogout,
    handleLanguageChange
  } = useAppData();

  if (isLoading) {
    return <AppLoadingSpinner />;
  }

  // The standard site chrome: header, main content, footer.
  const withSiteChrome = (content) => (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <style>{`
        .rtl { direction: rtl; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
        .ltr { direction: ltr; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>
      
      <AppHeader
        isRTL={isRTL}
        user={user}
        settings={settings}
        experiments={experiments}
        location={location}
        handleLogout={handleLogout}
        handleLanguageChange={handleLanguageChange}
      />

      <main className="flex-1">
        {content}
      </main>

      <AppFooter isRTL={isRTL} currentPageName={currentPageName} />
    </div>
  );

  const pageErrorFallback = ({ reset }) => <PageErrorFallback isRTL={isRTL} reset={reset} />;

  // On specific pages, render only children without the main layout wrapper
  if (FULL_SCREEN_PAGES.includes(currentPageName)) {
    // These pages have no site header of their own once they crash, so the
    // error fallback is shown inside the standard chrome to keep navigation usable.
    return (
      <ErrorBoundary
        resetKey={location.pathname}
        fallback={(props) => withSiteChrome(pageErrorFallback(props))}
      >
        <main className="h-screen bg-slate-50">
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
