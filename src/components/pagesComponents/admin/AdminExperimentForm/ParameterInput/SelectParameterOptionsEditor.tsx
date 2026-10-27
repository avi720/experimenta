import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors } from '@/types/admin';
import type { Parameter } from '@/types/experiment';

type SelectParameterOptionsEditorProps = Pick<ExperimentFormHandlers, 'handleDynamicArrayChange' | 'handleNestedDynamicChange' | 'addNestedToArray' | 'removeNestedFromArray'> & {
  param: Parameter;
  index: number;
  errors: FormErrors;
};

export default function SelectParameterOptionsEditor({
  param,
  index,
  handleDynamicArrayChange,
  handleNestedDynamicChange,
  addNestedToArray,
  removeNestedFromArray,
  errors
}: SelectParameterOptionsEditorProps) {
  const { t, pick } = useTranslation();
  const options = param.options || [];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">{t('admin.form.parameters.selectOptionsLabel')}</Label>
        <div className="space-y-2 mt-2">
          {options.map((option, optIndex) => (
            <div key={optIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-slate-50 rounded">
              <Input
                placeholder={t('admin.form.parameters.optionValuePlaceholder')}
                value={option.value || ''}
                onChange={e => handleNestedDynamicChange('parameters', index, 'options', optIndex, 'value', e.target.value)}
              />
              <Input
                placeholder={t('admin.form.parameters.optionLabelHePlaceholder')}
                value={option.label_he || ''}
                onChange={e => handleNestedDynamicChange('parameters', index, 'options', optIndex, 'label_he', e.target.value)}
              />
              <Input
                placeholder={t('admin.form.parameters.optionLabelEnPlaceholder')}
                value={option.label_en || ''}
                onChange={e => handleNestedDynamicChange('parameters', index, 'options', optIndex, 'label_en', e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeNestedFromArray('parameters', index, 'options', optIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {errors[`param_${index}_options`] && (
          <p className="text-red-500 text-xs mt-1" role="alert">{errors[`param_${index}_options`]}</p>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={() => addNestedToArray('parameters', index, 'options', { value: '', label_he: '', label_en: '' })}
        >
          <PlusCircle className="me-2 h-4 w-4" />
          {t('admin.form.parameters.addOption')}
        </Button>
      </div>

      <div>
        <Label>{t('admin.form.parameters.defaultValueLabel')}</Label>
        <Select
          value={String(param.default || '')}
          onValueChange={val => handleDynamicArrayChange('parameters', index, 'default', val)}
        >
          <SelectTrigger className={errors[`param_${index}_default`] ? 'border-red-500' : ''}>
            <SelectValue placeholder={t('admin.form.parameters.selectDefaultPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {options
              .filter(option => option.value && option.value.trim() !== '')
              .map((option, optIndex) => (
                <SelectItem key={optIndex} value={option.value}>
                  {pick(option, option.value)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
