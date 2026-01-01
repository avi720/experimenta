import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, PlusCircle, Loader2 } from 'lucide-react';
import { useAdminExperiments } from '../components/hooks/useAdminExperiments';
import AdminExperimentCard from '../components/pagesComponents/admin/AdminExperiment/AdminExperimentCard';
import AdminExperimentsFilters from '../components/pagesComponents/admin/AdminExperiment/AdminExperimentsFilters';
import NoAdminExperimentsFound from '../components/pagesComponents/admin/AdminExperiment/NoAdminExperimentsFound';
import { createPageUrl } from '@/utils';
import { categoryNames, /*engineNames*/ } from '../components/pagesComponents/lab/labConstants';

export default function AdminExperiments() {
  const navigate = useNavigate();
  const {
    filteredExperiments = [],
    isLoading,
    stats = { total: 0, active: 0, inactive: 0, byCategory: {}, /*byEngine: {}*/ },
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    //selectedEngine, setSelectedEngine,
    showInactive, setShowInactive,
    sortBy, setSortBy,
    sortDirection, setSortDirection,
    handleDelete,
    handleDuplicate,
    toggleActive,
    exportExperiments
  } = useAdminExperiments();

  const handleSortChange = (value) => {
    const [newSortBy, newSortDirection] = value.split('-');
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    //setSelectedEngine("all");
    setShowInactive(false);
    setSortBy("created_date");
    setSortDirection("desc");
  };

  const activeFiltersCount = 
    (searchTerm ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (showInactive ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ניהול ניסויים</h1>
          <p className="text-slate-500 mt-1">יצירה, עריכה וניהול של תבניות הניסויים במערכת.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportExperiments}><FileDown className="w-4 h-4 ml-2" />ייצא נתונים</Button>
          <Button onClick={() => navigate(createPageUrl("AdminExperimentForm"))}><PlusCircle className="w-4 h-4 ml-2" />צור ניסוי חדש</Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Badge variant="outline" className="flex-col items-start h-auto p-4 gap-1">
            <span className="text-2xl font-bold">{stats.total}</span>
            <span className="text-slate-500">ניסויים בסה"כ</span>
        </Badge>
        <Badge variant="outline" className="flex-col items-start h-auto p-4 gap-1 border-green-300 bg-green-50">
            <span className="text-2xl font-bold text-green-700">{stats.active}</span>
            <span className="text-green-600">פעילים</span>
        </Badge>
        <Badge variant="outline" className="flex-col items-start h-auto p-4 gap-1 border-amber-300 bg-amber-50">
            <span className="text-2xl font-bold text-amber-700">{stats.inactive}</span>
            <span className="text-amber-600">לא פעילים</span>
        </Badge>
      </div>

      {/* Advanced Filters extracted into AdminExperimentsFilters component */}
      <AdminExperimentsFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        //selectedEngine={selectedEngine} setSelectedEngine={setSelectedEngine}
        sortBy={sortBy} sortDirection={sortDirection} handleSortChange={handleSortChange}
        showInactive={showInactive} setShowInactive={setShowInactive}
        stats={stats}
        categoryNames={categoryNames} //engineNames={engineNames}
        activeFiltersCount={activeFiltersCount}
        clearFilters={clearFilters}
      />

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (filteredExperiments && filteredExperiments.length > 0) ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">נמצאו {filteredExperiments.length} מתוך {stats.total} ניסויים.</p>
          <AnimatePresence>
            <div className="grid gap-6">
              {filteredExperiments.map((exp, index) => (
                <AdminExperimentCard 
                  key={exp.id}
                  experiment={exp}
                  index={index}
                  handleDelete={handleDelete}
                  handleDuplicate={handleDuplicate}
                  toggleActive={toggleActive}
                />
              ))}
            </div>
          </AnimatePresence>
        </div>
      ) : (
        <NoAdminExperimentsFound clearFilters={clearFilters} />
      )}
    </div>
  );
}