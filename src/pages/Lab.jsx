import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { categoryIcons, categoryNames } from "../components/pagesComponents/lab/labConstants";
import { useAppData } from "../components/hooks/useAppData";
// Import hooks and components
import { useLabData } from "../components/hooks/useLabData";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">{isRTL ? "טוען ניסויים..." : "Loading experiments..."}</p>
        </div>
      </div>
    );
  }

  // If lab is not enabled, show message
  if (!settings?.virtual_lab_enabled) {
    return <LabUnavailableMessage isRTL={isRTL} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
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
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-600">{isRTL ? "טוען ניסויים..." : "Loading experiments..."}</p>
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