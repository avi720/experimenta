import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { fieldErrorClass, fieldLabelClass, inputErrorClass } from '../adminStyles';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors } from '@/types/admin';
import type { ExperimentFormData, Locale } from '@/types/experiment';

type I18nTextInputProps = Pick<ExperimentFormHandlers, 'handleI18nChange'> & {
  field: 'title' | 'short_desc' | 'safety_notes';
  experiment: ExperimentFormData;
  errors: FormErrors;
  type?: 'input' | 'textarea';
  labelHe: string;
  labelEn: string;
  placeholderHe: string;
  placeholderEn: string;
  rows?: number;
  required?: boolean;
};

export default function I18nTextInput({
  field,
  experiment,
  handleI18nChange,
  errors,
  type = 'input',
  labelHe,
  labelEn,
  placeholderHe,
  placeholderEn,
  rows = 3,
  required = false
}: I18nTextInputProps) {
  const InputComponent = type === 'textarea' ? Textarea : Input;
  const baseId = useId();

  // Each language column takes its own direction, so Hebrew reads right-to-left even in the English UI.
  const columns: { locale: Locale; label: string; placeholder: string; dir: 'rtl' | 'ltr' }[] = [
    { locale: 'he', label: labelHe, placeholder: placeholderHe, dir: 'rtl' },
    { locale: 'en', label: labelEn, placeholder: placeholderEn, dir: 'ltr' },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {columns.map(({ locale, label, placeholder, dir }) => {
        const id = `${baseId}-${locale}`;
        const error = errors[`${field}_${locale}`];
        return (
          <div key={locale}>
            <Label htmlFor={id} className={fieldLabelClass}>
              {label} {required && <span className="text-plasma" aria-hidden="true">*</span>}
            </Label>
            <InputComponent
              id={id}
              dir={dir}
              lang={locale}
              value={experiment.i18n_texts?.[locale]?.[field] || ''}
              onChange={e => handleI18nChange(locale, field, e.target.value)}
              placeholder={placeholder}
              className={error ? inputErrorClass : ''}
              rows={type === 'textarea' ? rows : undefined}
              aria-invalid={error ? true : undefined}
              aria-required={required || undefined}
            />
            {error && (
              <p className={fieldErrorClass}>{error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
