import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { dangerIconButtonClass, fieldLabelClass, secondaryButtonClass } from '../adminStyles';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { Locale } from '@/types/experiment';

type I18nStepsEditorProps = Pick<ExperimentFormHandlers, 'handleI18nStepsChange' | 'addI18nStep' | 'removeI18nStep'> & {
  locale: Locale;
  steps: string[];
  label: string;
  placeholder: string;
};

export default function I18nStepsEditor({
  locale,
  steps,
  handleI18nStepsChange,
  addI18nStep,
  removeI18nStep,
  label,
  placeholder
}: I18nStepsEditorProps) {
  const { t } = useTranslation();

  return (
    <div>
      <p className={fieldLabelClass}>{label}</p>
      <ol className="space-y-2">
        {(steps || []).map((step, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-6 flex-shrink-0 text-center font-mono text-xs tabular-nums text-dust" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Input
              value={step}
              onChange={(e) => handleI18nStepsChange(locale, index, e.target.value)}
              placeholder={`${placeholder} ${index + 1}`}
              aria-label={`${label} ${index + 1}`}
              dir={locale === 'he' ? 'rtl' : 'ltr'}
              lang={locale}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`${dangerIconButtonClass} flex-shrink-0`}
              onClick={() => removeI18nStep(locale, index)}
              aria-label={`${t('admin.form.removeItem')} ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        onClick={() => addI18nStep(locale)}
        className={`${secondaryButtonClass} mt-3 w-full border-dashed`}
      >
        <Plus className="h-4 w-4" />
        {t(locale === 'he' ? 'admin.form.content.addStepHe' : 'admin.form.content.addStepEn')}
      </Button>
    </div>
  );
}
