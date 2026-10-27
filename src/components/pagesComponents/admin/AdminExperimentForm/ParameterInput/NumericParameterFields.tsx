import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/components/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors } from '@/types/admin';
import type { Parameter } from '@/types/experiment';

// Numeric fields are edited as text; a missing value leaves the input empty.
const inputValue = (value: Parameter['default']) => (typeof value === 'boolean' ? String(value) : value ?? undefined);

type NumericParameterFieldsProps = Pick<ExperimentFormHandlers, 'handleDynamicArrayChange'> & {
  param: Parameter;
  index: number;
  errors: FormErrors;
};

export default function NumericParameterFields({ 
  param, 
  index, 
  handleDynamicArrayChange, 
  errors 
}: NumericParameterFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <Label>{t('admin.form.parameters.defaultValueRequired')}</Label>
        <Input
          type="text"
          value={inputValue(param.default)}
          onChange={e => handleDynamicArrayChange('parameters', index, 'default', e.target.value)}
          className={errors[`param_${index}_default`] ? 'border-red-500' : ''}
        />
        {errors[`param_${index}_default`] && (
          <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_default`]}</p>
        )}
      </div>

      <div>
        <Label>{t('admin.form.parameters.minLabel')}</Label>
        <Input
          type="text"
          value={inputValue(param.min)}
          onChange={e => handleDynamicArrayChange('parameters', index, 'min', e.target.value)}
          className={errors[`param_${index}_min`] ? 'border-red-500' : ''}
        />
        {errors[`param_${index}_min`] && (
          <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_min`]}</p>
        )}
      </div>

      <div>
        <Label>{t('admin.form.parameters.maxLabel')}</Label>
        <Input
          type="text"
          value={inputValue(param.max)}
          onChange={e => handleDynamicArrayChange('parameters', index, 'max', e.target.value)}
          className={errors[`param_${index}_max`] ? 'border-red-500' : ''}
        />
        {errors[`param_${index}_max`] && (
          <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_max`]}</p>
        )}
      </div>

      <div>
        <Label>{t('admin.form.parameters.stepLabel')}</Label>
        <Input
          type="text"
          value={inputValue(param.step)}
          onChange={e => handleDynamicArrayChange('parameters', index, 'step', e.target.value)}
          className={errors[`param_${index}_step`] ? 'border-red-500' : ''}
        />
        {errors[`param_${index}_step`] && (
          <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_step`]}</p>
        )}
      </div>
    </div>
  );
}
