import { useRef } from "react";
import { useAppData } from "@/hooks/useAppData";
import { useTranslation } from "@/i18n";
import HeroSection from "../components/pagesComponents/dashboard/HeroSection";
import FeaturesSection from "../components/pagesComponents/dashboard/FeaturesSection";
import HowItWorksSection from "../components/pagesComponents/dashboard/HowItWorksSection";
import FaqSection from "../components/pagesComponents/dashboard/FaqSection";
import FinalCtaSection from "../components/pagesComponents/dashboard/FinalCtaSection";
import { useScrollMotion } from "../components/pagesComponents/dashboard/useScrollMotion";

// The home page is the first surface on the new brand (docs/BRAND.md).
export default function Dashboard() {
  const { settings, experiments, isLoading, isRTL } = useAppData();
  const { t, dir } = useTranslation(isRTL);
  const rootRef = useRef<HTMLDivElement>(null);
  useScrollMotion(rootRef, !isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-space">
        <p className="text-dust">{t("common.loading")}</p>
      </div>
    );
  }

  const hasExperiment = (slug: string) => experiments.some((experiment) => experiment.slug === slug);

  return (
    <div ref={rootRef} className="bg-space text-star" dir={dir}>
      <HeroSection settings={settings} isRTL={isRTL} hasDoubleSlit={hasExperiment("double-slit")} />
      <FeaturesSection isRTL={isRTL} />
      <HowItWorksSection isRTL={isRTL} />
      <FaqSection isRTL={isRTL} />
      <FinalCtaSection isRTL={isRTL} hasFreeFall={hasExperiment("free-fall")} />
    </div>
  );
}
