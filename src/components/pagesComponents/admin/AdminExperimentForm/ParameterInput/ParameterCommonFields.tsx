import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { parameterTypes } from '../adminFormConstants';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/components/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors } from '@/types/admin';
import type { Parameter } from '@/types/experiment';

type ParameterCommonFieldsProps = Pick<ExperimentFormHandlers, 'handleDynamicArrayChange'> & {
  param: Parameter;
  index: number;
  errors: FormErrors;
};

export default function ParameterCommonFields({ 
  param, 
  index, 
  handleDynamicArrayChange, 
  errors 
}: ParameterCommonFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>{t('admin.form.parameters.keyLabel')}</Label>
          <Input
            value={param.key}
            onChange={e => handleDynamicArrayChange('parameters', index, 'key', e.target.value)}
            placeholder="mass, velocity, amplitude"
            className={errors[`param_${index}_key`] ? 'border-red-500' : ''}
          />
          {errors[`param_${index}_key`] && (
            <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_key`]}</p>
          )}
        </div>

        <div>
          <Label>{t('admin.form.parameters.dataTypeLabel')}</Label>
          <Select
            value={param.type}
            onValueChange={val => handleDynamicArrayChange('parameters', index, 'type', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {parameterTypes.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.i18nKey ? t(option.i18nKey) : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t('admin.form.parameters.unitLabel')}</Label>
          <Input
            value={param.unit || ''}
            onChange={e => handleDynamicArrayChange('parameters', index, 'unit', e.target.value)}
            placeholder="m, kg, m/s"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-4">
        <Switch
          checked={param.is_active !== false}
          onCheckedChange={val => handleDynamicArrayChange('parameters', index, 'is_active', val)}
        />
        <Label>{t('admin.form.parameters.activeParamLabel')}</Label>
      </div>
    </>
  );
}
