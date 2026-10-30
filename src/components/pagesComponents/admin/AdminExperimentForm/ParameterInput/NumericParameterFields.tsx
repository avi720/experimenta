import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldErrorClass, fieldLabelClass, inputErrorClass } from '../../adminStyles';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors } from '@/types/admin';
import type { Parameter } from '@/types/experiment';

// Numeric fields are edited as text; a missing value leaves the input empty.
const inputValue = (value: Parameter['default']) => (typeof value === 'boolean' ? String(value) : value ?? undefined);

type NumericParameterFieldsProps = Pick<ExperimentFormHandlers, 'handleDynamicArrayChange'> & {
  param: Parameter;
  index: number;
  errors: FormErrors;
};

const numericFields = [
  { field: 'default', labelKey: 'admin.form.parameters.defaultValueRequired' },
  { field: 'min', labelKey: 'admin.form.parameters.minLabel' },
  { field: 'max', labelKey: 'admin.form.parameters.maxLabel' },
  { field: 'step', labelKey: 'admin.form.parameters.stepLabel' },
] as const;

export default function NumericParameterFields({
  param,
  index,
  handleDynamicArrayChange,
  errors
}: NumericParameterFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {numericFields.map(({ field, labelKey }) => {
        const id = `param-${index}-${field}`;
        const error = errors[`param_${index}_${field}`];
        return (
          <div key={field}>
            <Label htmlFor={id} className={fieldLabelClass}>{t(labelKey)}</Label>
            <div className="relative">
              <Input
                id={id}
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={inputValue(param[field])}
                onChange={e => handleDynamicArrayChange('parameters', index, field, e.target.value)}
                className={`font-mono tabular-nums ${param.unit ? 'pe-12' : ''} ${error ? inputErrorClass : ''}`}
                aria-invalid={error ? true : undefined}
              />
              {param.unit && (
                <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 font-mono text-xs text-dust" dir="ltr" aria-hidden="true">
                  {param.unit}
                </span>
              )}
            </div>
            {error && (
              <p className={fieldErrorClass}>{error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
