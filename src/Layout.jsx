import React from "react";
import { useLocation } from "react-router-dom";
import AppHeader from "./components/layout/AppHeader";
import AppFooter from "./components/layout/AppFooter";
import AppLoadingSpinner from "./components/layout/AppLoadingSpinner";
import { useAppData } from "./components/hooks/useAppData";

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

  // On specific pages, render only children without the main layout wrapper
  const pagesWithCustomLayout = [
    'LabWorkspace', 'AdminExperimentForm', 'FreeFallExperiment', 
    'ShoExperiment', 'QuantumTunnelingExperiment', 'DoubleSlitExperiment'
  ];
  if (pagesWithCustomLayout.includes(currentPageName)) {
    return (
      <main className="h-screen bg-slate-50">
        {children}
      </main>
    );
  }

  return (
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
        {children}
      </main>

      <AppFooter isRTL={isRTL} currentPageName={currentPageName} />
    </div>
  );
}