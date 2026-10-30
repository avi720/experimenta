import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n";
import { fieldLabelClass, selectTriggerClass } from "./resultsStyles";
import type { ExperimentRun } from "@/types/models";
import type { RunFilters } from "@/types/results";

type ResultsFiltersProps = {
  runs: ExperimentRun[];
  filters: RunFilters;
  onFiltersChange: (patch: Partial<RunFilters>) => void;
  resultsCount: number;
};


export default function ResultsFilters({ runs, filters, onFiltersChange, resultsCount }: ResultsFiltersProps) {
  const { t } = useTranslation();
  const experimentSlugs = useMemo(
    () => [...new Set(runs.map((run) => run.experiment_slug).filter(Boolean))],
    [runs]
  );

  return (
    <section
      aria-label={t('results.filtersTitle')}
      className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6"
    >
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-4 sm:gap-6 flex-1 sm:max-w-xl">
        <div className="space-y-2">
          <Label className={fieldLabelClass}>{t('results.experimentLabel')}</Label>
          <Select value={filters.experiment} onValueChange={(value) => onFiltersChange({ experiment: value })}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.allExperiments')}</SelectItem>
              {experimentSlugs.map((slug) => (
                <SelectItem key={String(slug)} value={String(slug)}>{String(slug)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>{t('results.dateRangeLabel')}</Label>
          <Select value={filters.dateRange} onValueChange={(value) => onFiltersChange({ dateRange: value })}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('results.allDates')}</SelectItem>
              <SelectItem value="today">{t('results.today')}</SelectItem>
              <SelectItem value="week">{t('results.thisWeek')}</SelectItem>
              <SelectItem value="month">{t('results.thisMonth')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="sm:ms-auto h-10 flex items-center gap-2 text-sm text-dust" aria-live="polite">
        <span className="font-mono tabular-nums text-star">{resultsCount}</span>
        {t('results.resultsCountLabel')}
      </p>
    </section>
  );
}
