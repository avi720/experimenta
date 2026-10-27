import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { useTranslation } from "@/i18n";

export default function ResultsFilters({ runs, filters, onFiltersChange, resultsCount }) {
  const { t } = useTranslation();
  const experimentSlugs = useMemo(
    () => [...new Set(runs.map((run) => run.experiment_slug).filter(Boolean))],
    [runs]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          {t('results.filtersTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>{t('results.experimentLabel')}</Label>
          <Select value={filters.experiment} onValueChange={(value) => onFiltersChange({ experiment: value })}>
            <SelectTrigger>
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

        <div>
          <Label>{t('results.dateRangeLabel')}</Label>
          <Select value={filters.dateRange} onValueChange={(value) => onFiltersChange({ dateRange: value })}>
            <SelectTrigger>
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

        <div className="flex items-end">
          <Badge variant="outline" className="h-10 flex items-center">
            {resultsCount} {t('results.resultsCountLabel')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
