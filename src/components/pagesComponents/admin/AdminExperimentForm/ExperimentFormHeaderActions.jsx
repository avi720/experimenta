import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Save, Eye, FileDown } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { getExperimentWorkspaceUrl } from '@/components/simulation/experimentRegistry';
import { useTranslation } from '@/i18n';

export default function ExperimentFormHeaderActions({ 
  isEditMode, 
  experiment, 
  exportExperiment, 
  navigate, 
  isSaving, 
  hasChanges 
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {isEditMode ? t('admin.form.editTitle') : t('admin.form.createTitle')}
        </h1>
        {experiment.slug && (
          <Badge variant="outline" className="text-sm">
            {experiment.slug}
          </Badge>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={exportExperiment}
          className="gap-2"
        >
          <FileDown className="w-4 h-4" />
          {t('admin.form.exportJson')}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => window.open(getExperimentWorkspaceUrl(experiment.slug), '_blank')}
          disabled={!experiment.slug}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          {t('admin.form.preview')}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(createPageUrl('AdminExperiments'))}
        >
          <ArrowRight className="w-4 h-4 me-2" />
          {t('common.back')}
        </Button>

        <Button
          type="submit"
          disabled={isSaving || (!hasChanges && isEditMode)}
          className="bg-blue-600 hover:bg-blue-700 gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}
