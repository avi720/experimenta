import React from "react";
import { useAppData } from "../Components/hooks/useAppData";

// Import the dashboard components from the new location
import HeroSection from "../components/pagesComponents/dashboard/HeroSection";
import FeaturesGrid from "../components/pagesComponents/dashboard/FeaturesGrid";
import WhatYouCanDoSection from "../components/pagesComponents/dashboard/WhatYouCanDoSection";
import LabStatusSection from "../components/pagesComponents/dashboard/LabStatusSection";

export default function Dashboard() {

  const {settings, isLoading, isRTL } = useAppData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">{isRTL ? "טוען..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <HeroSection settings={settings} isRTL={isRTL} />

      {/* Features Grid */}
      <FeaturesGrid isRTL={isRTL} />

      {/* What You Can Do */}
      <WhatYouCanDoSection isRTL={isRTL} />

      {/* Lab Status */}
      <LabStatusSection settings={settings} isRTL={isRTL} />
    </div>
  );
}