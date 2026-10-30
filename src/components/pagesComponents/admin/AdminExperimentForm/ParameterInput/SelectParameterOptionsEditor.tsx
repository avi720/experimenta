import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { dangerIconButtonClass, fieldErrorClass, fieldLabelClass, inputErrorClass } from '../../adminStyles';
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
    <div className="space-y-6">
      <div>
        <p className={fieldLabelClass}>{t('admin.form.parameters.selectOptionsLabel')}</p>
        <ol className="divide-y divide-line/70 rounded-md border border-line">
          {options.map((option, optIndex) => (
            <li key={optIndex} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 p-2 md:grid-cols-[1.5rem_repeat(3,minmax(0,1fr))_auto]">
              <span className="text-center font-mono text-xs tabular-nums text-dust" aria-hidden="true">{optIndex + 1}</span>
              <Input
                placeholder={t('admin.form.parameters.optionValuePlaceholder')}
                aria-label={t('admin.form.parameters.optionValuePlaceholder')}
                dir="ltr"
                className="font-mono"
                value={option.value || ''}
                onChange={e => handleNestedDynamicChange('parameters', index, 'options', optIndex, 'value', e.target.value)}
              />
              <Input
                placeholder={t('admin.form.parameters.optionLabelHePlaceholder')}
                aria-label={t('admin.form.parameters.optionLabelHePlaceholder')}
                dir="rtl"
                lang="he"
                className="col-start-2 md:col-start-auto"
                value={option.label_he || ''}
                onChange={e => handleNestedDynamicChange('parameters', index, 'options', optIndex, 'label_he', e.target.value)}
              />
              <Input
                placeholder={t('admin.form.parameters.optionLabelEnPlaceholder')}
                aria-label={t('admin.form.parameters.optionLabelEnPlaceholder')}
                dir="ltr"
                lang="en"
                className="col-start-2 md:col-start-auto"
                value={option.label_en || ''}
                onChange={e => handleNestedDynamicChange('parameters', index, 'options', optIndex, 'label_en', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`${dangerIconButtonClass} col-start-3 row-start-1 md:col-start-auto md:row-start-auto`}
                onClick={() => removeNestedFromArray('parameters', index, 'options', optIndex)}
                aria-label={`${t('admin.form.removeItem')} ${optIndex + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          <li className="p-2">
            <Button
              type="button"
              variant="ghost"
              className="focus-ring h-9 w-full gap-2 text-dust hover:bg-space-raised hover:text-star"
              onClick={() => addNestedToArray('parameters', index, 'options', { value: '', label_he: '', label_en: '' })}
            >
              <Plus className="h-4 w-4" />
              {t('admin.form.parameters.addOption')}
            </Button>
          </li>
        </ol>
        {errors[`param_${index}_options`] && (
          <p className={fieldErrorClass} role="alert">{errors[`param_${index}_options`]}</p>
        )}
      </div>

      <div className="max-w-xs">
        <Label className={fieldLabelClass}>{t('admin.form.parameters.defaultValueLabel')}</Label>
        <Select
          value={String(param.default || '')}
          onValueChange={val => handleDynamicArrayChange('parameters', index, 'default', val)}
        >
          <SelectTrigger
            className={errors[`param_${index}_default`] ? inputErrorClass : ''}
            aria-label={t('admin.form.parameters.defaultValueLabel')}
          >
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
