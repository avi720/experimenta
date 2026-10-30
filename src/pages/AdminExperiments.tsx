import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileDown, Plus, Loader2 } from 'lucide-react';
import { useAdminExperiments } from '@/hooks/useAdminExperiments';
import AdminExperimentCard from '../components/pagesComponents/admin/AdminExperiment/AdminExperimentCard';
import AdminExperimentsFilters from '../components/pagesComponents/admin/AdminExperiment/AdminExperimentsFilters';
import NoAdminExperimentsFound from '../components/pagesComponents/admin/AdminExperiment/NoAdminExperimentsFound';
import { primaryButtonClass, secondaryButtonClass } from '../components/pagesComponents/admin/adminStyles';
import { createPageUrl } from '@/utils';
import { categoryNames } from '../components/pagesComponents/lab/labConstants';
import { useTranslation } from '@/i18n';

export default function AdminExperiments() {
  const navigate = useNavigate();
  const { t, dir } = useTranslation();
  const {
    filteredExperiments = [],
    isLoading,
    stats,
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    showInactive, setShowInactive,
    sortBy, setSortBy,
    sortDirection, setSortDirection,
    handleDelete,
    handleDuplicate,
    toggleActive,
    exportExperiments
  } = useAdminExperiments();

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortDirection] = value.split('-');
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setShowInactive(false);
    setSortBy("created_date");
    setSortDirection("desc");
  };

  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (showInactive ? 1 : 0);

  // Readouts: a hairline-separated row of measured counts, coloured only where the state matters.
  const statItems = [
    { key: 'total', value: stats.total, label: t('admin.list.totalStat'), valueClass: 'text-star' },
    { key: 'active', value: stats.active, label: t('admin.list.activeStat'), valueClass: 'text-emerald-300' },
    { key: 'inactive', value: stats.inactive, label: t('admin.list.inactiveStat'), valueClass: 'text-amber-300' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14 text-star" dir={dir}>
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[clamp(2rem,4vw,2.6rem)] font-light leading-[1.1] tracking-[-0.01em] text-star">
            {t('admin.list.title')}
          </h1>
          <p className="mt-3 max-w-[36rem] text-[15px] leading-relaxed text-dust">{t('admin.list.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className={secondaryButtonClass}
            onClick={exportExperiments}
            disabled={!filteredExperiments || filteredExperiments.length === 0}
          >
            <FileDown className="w-4 h-4" />
            {t('admin.list.exportData')}
          </Button>
          <Button className={primaryButtonClass} onClick={() => navigate(createPageUrl("AdminExperimentForm"))}>
            <Plus className="w-4 h-4" />
            {t('admin.list.createNew')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <dl className="mt-10 grid grid-cols-3 border-y border-line">
        {statItems.map((item, index) => (
          <div key={item.key} className={`px-4 py-5 sm:px-6 ${index > 0 ? 'border-s border-line' : ''}`}>
            <dt className="text-xs sm:text-sm text-dust">{item.label}</dt>
            <dd className={`mt-1 font-mono text-2xl sm:text-3xl tabular-nums ${item.valueClass}`}>{item.value}</dd>
          </div>
        ))}
      </dl>

      {/* Advanced Filters */}
      <AdminExperimentsFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        sortBy={sortBy} sortDirection={sortDirection} handleSortChange={handleSortChange}
        showInactive={showInactive} setShowInactive={setShowInactive}
        stats={stats}
        categoryNames={categoryNames}
        activeFiltersCount={activeFiltersCount}
        clearFilters={clearFilters}
      />

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
            <Loader2 className="w-7 h-7 text-blueshift animate-spin" />
        </div>
      ) : (filteredExperiments && filteredExperiments.length > 0) ? (
        <div>
          <p className="mb-3 text-sm text-dust">
            {t('admin.list.foundCount', { filtered: filteredExperiments.length, total: stats.total })}
          </p>
          {/* Column legend for the rows below (md+); rows stack on small screens. */}
          <div
            aria-hidden="true"
            className="hidden md:grid grid-cols-[minmax(0,1fr)_7rem_7rem_6rem_2.5rem] gap-4 border-b border-line px-4 pb-2 text-xs text-dust"
          >
            <span>{t('admin.list.colExperiment')}</span>
            <span>{t('admin.list.colStatus')}</span>
            <span>{t('admin.list.colAccess')}</span>
            <span>{t('admin.list.colCreated')}</span>
            <span />
          </div>
          <AnimatePresence>
            <div className="divide-y divide-line border-b border-line">
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
