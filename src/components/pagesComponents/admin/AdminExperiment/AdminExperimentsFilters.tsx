import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import StatusPill from '../StatusPill';
import { useTranslation } from '@/i18n';
import type { AdminExperimentStats } from '@/types/admin';
import type { Bilingual } from '@/types/experiment';

type AdminExperimentsFiltersProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  sortBy: string;
  sortDirection: string;
  handleSortChange: (value: string) => void;
  showInactive: boolean;
  setShowInactive: (value: boolean) => void;
  stats: AdminExperimentStats;
  categoryNames: Record<string, Bilingual>;
  activeFiltersCount: number;
  clearFilters: () => void;
};

const controlClass = 'h-10 border-line bg-space-raised/50 text-star placeholder:text-dust/70 focus-visible:ring-blueshift';

export default function AdminExperimentsFilters({
  searchTerm, setSearchTerm,
  selectedCategory, setSelectedCategory,
  sortBy, sortDirection, handleSortChange,
  showInactive, setShowInactive,
  stats,
  categoryNames,
  activeFiltersCount,
  clearFilters
}: AdminExperimentsFiltersProps) {
  const { t, pick } = useTranslation();

  return (
    <motion.div layout className="mt-8 mb-8">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dust" />
          <Input
            placeholder={t('admin.list.searchPlaceholder')}
            aria-label={t('admin.list.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${controlClass} ps-9 pe-3`}
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className={controlClass} aria-label={t('admin.list.filterByCategory')}>
            <SelectValue placeholder={t('admin.list.filterByCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.allCategories')}</SelectItem>
            {Object.entries(categoryNames).map(([key]) => (
              <SelectItem key={key} value={key}>
                {pick(categoryNames[key], key)} <span className="font-mono text-dust">({stats.byCategory[key] || 0})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={`${sortBy}-${sortDirection}`} onValueChange={handleSortChange}>
          <SelectTrigger className={controlClass} aria-label={t('admin.list.sortByPlaceholder')}>
            <SelectValue placeholder={t('admin.list.sortByPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_date-desc">{t('admin.list.sortCreatedDesc')}</SelectItem>
            <SelectItem value="created_date-asc">{t('admin.list.sortCreatedAsc')}</SelectItem>
            <SelectItem value="updated_date-desc">{t('admin.list.sortUpdatedDesc')}</SelectItem>
            <SelectItem value="title-asc">{t('admin.list.sortTitleAsc')}</SelectItem>
            <SelectItem value="title-desc">{t('admin.list.sortTitleDesc')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 flex min-h-9 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
          <Label htmlFor="show-inactive" className="text-sm font-normal text-dust">{t('admin.list.showInactiveLabel')}</Label>
        </div>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <StatusPill tone="info">
              <SlidersHorizontal aria-hidden="true" className="w-3 h-3" />
              {t('admin.list.activeFiltersBadge', { count: activeFiltersCount })}
            </StatusPill>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="focus-ring h-8 gap-1 text-dust hover:bg-space-raised hover:text-star"
            >
              <X className="w-3.5 h-3.5" />
              {t('common.clearAll')}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
