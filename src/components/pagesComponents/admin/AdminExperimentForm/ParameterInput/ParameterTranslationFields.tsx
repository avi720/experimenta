import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldLabelClass } from '../../adminStyles';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { Parameter } from '@/types/experiment';

type ParameterTranslationFieldsProps = Pick<ExperimentFormHandlers, 'handleNestedDynamicChange'> & {
  param: Parameter;
  index: number;
};

export default function ParameterTranslationFields({
  param,
  index,
  handleNestedDynamicChange
}: ParameterTranslationFieldsProps) {
  const { t } = useTranslation();

  // Hebrew inputs read right-to-left and English left-to-right, whatever the UI language.
  const fields = [
    { group: 'i18n_labels', locale: 'he', labelKey: 'admin.form.parameters.labelHeRequired', placeholderKey: 'admin.form.parameters.labelHePlaceholder' },
    { group: 'i18n_labels', locale: 'en', labelKey: 'admin.form.parameters.labelEnRequired', placeholderKey: 'admin.form.parameters.labelEnPlaceholder' },
    { group: 'tooltip', locale: 'he', labelKey: 'admin.form.parameters.tooltipHeLabel', placeholderKey: 'admin.form.parameters.tooltipHePlaceholder' },
    { group: 'tooltip', locale: 'en', labelKey: 'admin.form.parameters.tooltipEnLabel', placeholderKey: 'admin.form.parameters.tooltipEnPlaceholder' },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map(({ group, locale, labelKey, placeholderKey }) => {
        const id = `param-${index}-${group}-${locale}`;
        return (
          <div key={id}>
            <Label htmlFor={id} className={fieldLabelClass}>{t(labelKey)}</Label>
            <Input
              id={id}
              dir={locale === 'he' ? 'rtl' : 'ltr'}
              lang={locale}
              value={param[group]?.[locale] || ''}
              onChange={e => handleNestedDynamicChange('parameters', index, group, null, locale, e.target.value)}
              placeholder={t(placeholderKey)}
            />
          </div>
        );
      })}
    </div>
  );
}
