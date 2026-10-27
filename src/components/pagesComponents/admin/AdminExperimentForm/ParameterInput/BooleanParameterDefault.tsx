import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/components/hooks/experimentForm/useExperimentFormHandlers';
import type { Parameter } from '@/types/experiment';

type BooleanParameterDefaultProps = Pick<ExperimentFormHandlers, 'handleDynamicArrayChange'> & {
  param: Parameter;
  index: number;
};

export default function BooleanParameterDefault({ 
  param, 
  index, 
  handleDynamicArrayChange 
}: BooleanParameterDefaultProps) {
  const { t } = useTranslation();

  return (
    <div>
      <Label>{t('admin.form.parameters.defaultValueLabel')}</Label>
      <Select
        value={String(param.default)}
        onValueChange={val => handleDynamicArrayChange('parameters', index, 'default', val)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">{t('admin.form.parameters.boolTrue')}</SelectItem>
          <SelectItem value="false">{t('admin.form.parameters.boolFalse')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
