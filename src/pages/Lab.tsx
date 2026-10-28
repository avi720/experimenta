import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { categoryIcons, categoryNames } from "../components/pagesComponents/lab/labConstants";
import { useAppData } from "@/hooks/useAppData";
import { useTranslation } from "@/i18n";
// Import hooks and components
import { useLabData } from "@/hooks/useLabData";
import { spinnerClass } from "../components/pagesComponents/lab/experimentTraits";
import LabUnavailableMessage from "../components/pagesComponents/lab/LabUnavailableMessage";
import LabHeader from "../components/pagesComponents/lab/LabHeader";
import LabFilters from "../components/pagesComponents/lab/LabFilters";
import ExperimentsByCategoryList from "../components/pagesComponents/lab/ExperimentsByCategoryList";
import FilteredExperimentsList from "../components/pagesComponents/lab/FilteredExperimentsList";

export default function Lab() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const categoryParam = urlParams.get('category');

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "all");

  // Get app-wide data (settings, user, locale)
  const { settings, isLoading: isAppSettingsLoading, isRTL } = useAppData();
  const { t, dir } = useTranslation(isRTL);
  
  // Pass filter parameters to useLabData hook
  const { 
    experimentsByCategory, 
    filteredExperiments,
    isExperimentsLoading
  } = useLabData(searchTerm, selectedCategory, isRTL);

  useEffect(() => {
    setSelectedCategory(categoryParam || "all");
  }, [categoryParam]);

  if (isAppSettingsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" role="status">
        <div className="flex items-center gap-3">
          <div className={spinnerClass} aria-hidden="true"></div>
          <p className="text-[15px] text-dust">{t("common.loadingExperiments")}</p>
        </div>
      </div>
    );
  }

  // If lab is not enabled, show message
  if (!settings?.virtual_lab_enabled) {
    return <LabUnavailableMessage isRTL={isRTL} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20 md:pt-20 md:pb-28" dir={dir}>
      {/* Header */}
      <LabHeader selectedCategory={selectedCategory} isRTL={isRTL} categoryNames={categoryNames} />

      {/* Filters */}
      <LabFilters
        isRTL={isRTL}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        experimentsByCategory={experimentsByCategory}
        categoryIcons={categoryIcons}
        categoryNames={categoryNames}
      />

      {/* Experiments by Category or Filtered List */}
      {isExperimentsLoading ? (
        <div className="flex items-center justify-center py-20" role="status">
          <div className="flex items-center gap-3">
            <div className={spinnerClass} aria-hidden="true"></div>
            <p className="text-[15px] text-dust">{t("common.loadingExperiments")}</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
            {selectedCategory === "all" && !searchTerm ? (
            <ExperimentsByCategoryList
                experimentsByCategory={experimentsByCategory}
                isRTL={isRTL}
                categoryIcons={categoryIcons}
                categoryNames={categoryNames}
            />
            ) : (
              <FilteredExperimentsList
                filteredExperiments={filteredExperiments}
                isRTL={isRTL}
                categoryIcons={categoryIcons}
                />
            )}
        </AnimatePresence>
      )}
    </div>
  );
}
