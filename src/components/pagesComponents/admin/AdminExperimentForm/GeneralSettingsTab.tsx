import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import FormSection from './FormSection';
import { accessLevelOptions } from './adminFormConstants';
import { fieldErrorClass, fieldHintClass, fieldLabelClass, inputErrorClass } from '../adminStyles';
import { categoryNames } from '@/components/pagesComponents/lab/labConstants';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors } from '@/types/admin';
import type { ExperimentFormData } from '@/types/experiment';

type GeneralSettingsTabProps = Pick<ExperimentFormHandlers, 'handleInputChange'> & {
  experiment: ExperimentFormData;
  errors: FormErrors;
};

export default function GeneralSettingsTab({ experiment, handleInputChange, errors }: GeneralSettingsTabProps) {
  const { t, pick } = useTranslation();

  return (
    <FormSection title={t('admin.form.general.cardTitle')} description={t('admin.form.general.cardDescription')}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="exp-slug" className={fieldLabelClass}>{t('admin.form.general.slugLabel')}</Label>
          <Input
            id="exp-slug"
            dir="ltr"
            value={experiment.slug}
            onChange={e => handleInputChange('slug', e.target.value)}
            placeholder="free-fall, sho, quantum-tunneling"
            className={`font-mono ${errors.slug ? inputErrorClass : ''}`}
          />
          {errors.slug && <p className={fieldErrorClass} role="alert">{errors.slug}</p>}
          <p className={fieldHintClass}>
            {t('admin.form.general.slugHint')}
          </p>
        </div>

        <div>
          <Label className={fieldLabelClass}>{t('admin.form.general.categoryLabel')}</Label>
          <Select value={experiment.category ?? ''} onValueChange={val => handleInputChange('category', val)}>
            <SelectTrigger aria-label={t('admin.form.general.categoryLabel')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryNames).map(([value]) => (
                <SelectItem key={value} value={value}>
                  {pick(categoryNames[value], value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={fieldLabelClass}>{t('admin.form.general.visualizationTypeLabel')}</Label>
          <Select value={experiment.visualization_type ?? ''} onValueChange={val => handleInputChange('visualization_type', val)}>
            <SelectTrigger aria-label={t('admin.form.general.visualizationTypeLabel')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2d">{t('admin.form.general.vis2d')}</SelectItem>
              <SelectItem value="3d">{t('admin.form.general.vis3d')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className={fieldLabelClass}>{t('admin.form.general.accessLevelLabel')}</Label>
          <Select
            value={experiment.access_level || 'public'}
            onValueChange={val => handleInputChange('access_level', val)}
          >
            <SelectTrigger aria-label={t('admin.form.general.accessLevelLabel')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accessLevelOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.i18nKey ? t(option.i18nKey) : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 rounded-md border border-line bg-space-raised/50 px-4 py-3 md:col-span-2">
          <Switch
            id="exp-active"
            checked={experiment.is_active}
            onCheckedChange={val => handleInputChange('is_active', val)}
          />
          <Label htmlFor="exp-active" className="text-sm font-medium text-star">{t('admin.form.general.activeExperimentLabel')}</Label>
          <span className={`ms-auto text-xs ${experiment.is_active ? 'text-success' : 'text-amber-300'}`}>
            {experiment.is_active ? t('admin.list.activeStat') : t('admin.list.inactiveStat')}
          </span>
        </div>
      </div>
    </FormSection>
  );
}
