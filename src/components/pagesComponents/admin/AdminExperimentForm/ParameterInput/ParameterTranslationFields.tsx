import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{t('admin.form.parameters.labelHeRequired')}</Label>
          <Input
            value={param.i18n_labels?.he || ''}
            onChange={e => handleNestedDynamicChange('parameters', index, 'i18n_labels', null, 'he', e.target.value)}
            placeholder={t('admin.form.parameters.labelHePlaceholder')}
          />
        </div>
        <div>
          <Label>{t('admin.form.parameters.labelEnRequired')}</Label>
          <Input
            value={param.i18n_labels?.en || ''}
            onChange={e => handleNestedDynamicChange('parameters', index, 'i18n_labels', null, 'en', e.target.value)}
            placeholder={t('admin.form.parameters.labelEnPlaceholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{t('admin.form.parameters.tooltipHeLabel')}</Label>
          <Input
            value={param.tooltip?.he || ''}
            onChange={e => handleNestedDynamicChange('parameters', index, 'tooltip', null, 'he', e.target.value)}
            placeholder={t('admin.form.parameters.tooltipHePlaceholder')}
          />
        </div>
        <div>
          <Label>{t('admin.form.parameters.tooltipEnLabel')}</Label>
          <Input
            value={param.tooltip?.en || ''}
            onChange={e => handleNestedDynamicChange('parameters', index, 'tooltip', null, 'en', e.target.value)}
            placeholder={t('admin.form.parameters.tooltipEnPlaceholder')}
          />
        </div>
      </div>
    </div>
  );
}
