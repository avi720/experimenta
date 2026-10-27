import React from "react";
import { useAppData } from "../components/hooks/useAppData";
import { useTranslation } from "@/i18n";

// Import the dashboard components from the new location
import HeroSection from "../components/pagesComponents/dashboard/HeroSection";
import FeaturesGrid from "../components/pagesComponents/dashboard/FeaturesGrid";
import WhatYouCanDoSection from "../components/pagesComponents/dashboard/WhatYouCanDoSection";
import LabStatusSection from "../components/pagesComponents/dashboard/LabStatusSection";

export default function Dashboard() {
  const { settings, isLoading, isRTL } = useAppData();
  const { t, dir } = useTranslation(isRTL);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir={dir}>
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
