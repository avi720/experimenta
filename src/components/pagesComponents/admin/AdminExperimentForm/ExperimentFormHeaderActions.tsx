import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Eye, FileDown } from 'lucide-react';
import BlackHoleMark from '@/components/brand/BlackHoleMark';
import { createPageUrl } from '@/utils';
import { getExperimentWorkspaceUrl } from '@/simulation/experimentRegistry';
import { primaryButtonClass, secondaryButtonClass, iconButtonClass } from '../adminStyles';
import { useTranslation } from '@/i18n';
import type { NavigateFunction } from 'react-router-dom';
import type { ExperimentFormData } from '@/types/experiment';

type ExperimentFormHeaderActionsProps = {
  isEditMode: boolean;
  experiment: ExperimentFormData;
  exportExperiment: () => void;
  navigate: NavigateFunction;
  isSaving: boolean;
  hasChanges: boolean;
};

/**
 * The form is a full-screen page (no site header), so this is its own compact top bar:
 * brand mark, the page title with the slug, and the form actions. Secondary actions collapse
 * to icons on small screens; Save stays labelled.
 */
export default function ExperimentFormHeaderActions({
  isEditMode,
  experiment,
  exportExperiment,
  navigate,
  isSaving,
  hasChanges
}: ExperimentFormHeaderActionsProps) {
  const { t } = useTranslation();
  const compactSecondary = `${secondaryButtonClass} px-0 w-10 sm:w-auto sm:px-4`;

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-space/[0.85] backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={createPageUrl('Dashboard')}
            className="focus-ring flex flex-shrink-0 items-center gap-2 rounded-md"
            aria-label="Experimenta"
          >
            <BlackHoleMark className="h-7 w-7" />
            <span className="hidden text-[17px] font-medium tracking-tight text-star lg:inline" lang="en" dir="ltr">
              Experimenta
            </span>
          </Link>
          <span aria-hidden="true" className="hidden h-6 w-px bg-line sm:block" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('AdminExperiments'))}
            className={iconButtonClass}
            aria-label={t('admin.form.backToList')}
            title={t('admin.form.backToList')}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-medium leading-tight text-star sm:text-[17px]">
              {isEditMode ? t('admin.form.editTitle') : t('admin.form.createTitle')}
            </h1>
            <div className="flex items-center gap-2 text-xs text-dust">
              {experiment.slug && (
                <span className="truncate font-mono" dir="ltr">{experiment.slug}</span>
              )}
              {hasChanges && (
                <span className="flex items-center gap-1.5 whitespace-nowrap text-amber-300">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span className="hidden sm:inline">{t('admin.form.unsavedChanges')}</span>
                  <span className="sr-only sm:hidden">{t('admin.form.unsavedChanges')}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={exportExperiment}
            className={compactSecondary}
            aria-label={t('admin.form.exportJson')}
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">{t('admin.form.exportJson')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(getExperimentWorkspaceUrl(experiment.slug), '_blank')}
            disabled={!experiment.slug}
            className={compactSecondary}
            aria-label={t('admin.form.preview')}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">{t('admin.form.preview')}</span>
          </Button>

          <Button
            type="submit"
            disabled={isSaving || (!hasChanges && isEditMode)}
            className={primaryButtonClass}
          >
            <Save className="w-4 h-4" />
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </header>
  );
}
