import React from 'react';
import { Badge } from '@/components/ui/badge';
import { categoryNames } from '@/components/pagesComponents/lab/labConstants';
import { useTranslation } from '@/i18n';

export default function ExperimentPreviewCard({ experiment }) {
  const { t, pick } = useTranslation();
  const localizedTexts = pick(experiment.i18n_texts, null);
  const title = localizedTexts?.title || t('admin.form.advanced.untitled');
  const shortDesc = localizedTexts?.short_desc || t('admin.form.advanced.noDescription');
  const categoryLabel = pick(categoryNames[experiment.category], experiment.category);

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex gap-2">
          {categoryLabel && <Badge>{categoryLabel}</Badge>}
        </div>
      </div>
      
      <p className="text-slate-600">{shortDesc}</p>
      
      <div className="flex flex-wrap gap-1">
        {(experiment.tags || []).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            #{tag}
          </Badge>
        ))}
      </div>
      
      <div className="text-sm text-slate-500">
        <div>{t('admin.form.advanced.parametersCount', { count: experiment.parameters?.length || 0 })}</div>
        <div>{t('admin.form.advanced.presetsCount', { count: experiment.presets?.length || 0 })}</div>
      </div>
    </div>
  );
}
