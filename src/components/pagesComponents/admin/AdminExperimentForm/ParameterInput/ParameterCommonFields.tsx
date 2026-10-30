import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { parameterTypes } from '../adminFormConstants';
import { fieldErrorClass, fieldLabelClass, inputErrorClass } from '../../adminStyles';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
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
  const keyError = errors[`param_${index}_key`];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor={`param-${index}-key`} className={fieldLabelClass}>{t('admin.form.parameters.keyLabel')}</Label>
          <Input
            id={`param-${index}-key`}
            dir="ltr"
            value={param.key}
            onChange={e => handleDynamicArrayChange('parameters', index, 'key', e.target.value)}
            placeholder="mass, velocity, amplitude"
            className={`font-mono ${keyError ? inputErrorClass : ''}`}
          />
          {keyError && (
            <p className={fieldErrorClass}>{keyError}</p>
          )}
        </div>

        <div>
          <Label className={fieldLabelClass}>{t('admin.form.parameters.dataTypeLabel')}</Label>
          <Select
            value={param.type}
            onValueChange={val => handleDynamicArrayChange('parameters', index, 'type', val)}
          >
            <SelectTrigger aria-label={t('admin.form.parameters.dataTypeLabel')}>
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
          <Label htmlFor={`param-${index}-unit`} className={fieldLabelClass}>{t('admin.form.parameters.unitLabel')}</Label>
          <Input
            id={`param-${index}-unit`}
            dir="ltr"
            value={param.unit || ''}
            onChange={e => handleDynamicArrayChange('parameters', index, 'unit', e.target.value)}
            placeholder="m, kg, m/s"
            className="font-mono"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Switch
          id={`param-${index}-active`}
          checked={param.is_active !== false}
          onCheckedChange={val => handleDynamicArrayChange('parameters', index, 'is_active', val)}
        />
        <Label htmlFor={`param-${index}-active`} className="text-sm font-normal text-dust">
          {t('admin.form.parameters.activeParamLabel')}
        </Label>
      </div>
    </>
  );
}
