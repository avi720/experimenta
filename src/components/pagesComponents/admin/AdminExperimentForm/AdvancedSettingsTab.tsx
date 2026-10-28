import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ExperimentPreviewCard from './ExperimentPreviewCard';
import RawJsonViewer from './RawJsonViewer';
import FormSection from './FormSection';
import { fieldHintClass, fieldLabelClass } from '../adminStyles';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { ExperimentFormData } from '@/types/experiment';

type AdvancedSettingsTabProps = Pick<ExperimentFormHandlers, 'handleTagsChange' | 'handleOutputsChange' | 'handleInputChange'> & {
  experiment: ExperimentFormData;
};

export default function AdvancedSettingsTab({ experiment, handleTagsChange, handleOutputsChange, handleInputChange }: AdvancedSettingsTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-10">
      <FormSection title={t('admin.form.advanced.cardTitle')}>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="space-y-6">
            <div>
              <Label htmlFor="exp-tags" className={fieldLabelClass}>{t('admin.form.advanced.searchTagsLabel')}</Label>
              <Input
                id="exp-tags"
                value={(experiment.tags || []).join(', ')}
                onChange={e => handleTagsChange(e.target.value)}
                placeholder={t('admin.form.advanced.searchTagsPlaceholder')}
              />
              <p className={fieldHintClass}>
                {t('admin.form.advanced.searchTagsHint')}
              </p>
            </div>

            <div>
              <Label htmlFor="exp-outputs" className={fieldLabelClass}>{t('admin.form.advanced.outputsLabel')}</Label>
              <Input
                id="exp-outputs"
                dir="ltr"
                className="font-mono"
                value={(experiment.outputs || []).join(', ')}
                onChange={e => handleOutputsChange(e.target.value)}
                placeholder="position, velocity, energy_total"
              />
              <p className={fieldHintClass}>
                {t('admin.form.advanced.outputsHint')}
              </p>
            </div>

            <div>
              <Label htmlFor="exp-thumbnail" className={fieldLabelClass}>{t('admin.form.advanced.thumbnailUrlLabel')}</Label>
              <Input
                id="exp-thumbnail"
                dir="ltr"
                inputMode="url"
                value={experiment.thumbnail_url || ''}
                onChange={e => handleInputChange('thumbnail_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <p className={fieldLabelClass}>{t('admin.form.advanced.previewCardTitle')}</p>
            <ExperimentPreviewCard experiment={experiment} />
          </div>
        </div>
      </FormSection>

      <RawJsonViewer experiment={experiment} />
    </div>
  );
}
