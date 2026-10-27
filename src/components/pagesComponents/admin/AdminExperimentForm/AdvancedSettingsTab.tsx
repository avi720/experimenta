import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ExperimentPreviewCard from './ExperimentPreviewCard';
import RawJsonViewer from './RawJsonViewer';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/components/hooks/experimentForm/useExperimentFormHandlers';
import type { ExperimentFormData } from '@/types/experiment';

type AdvancedSettingsTabProps = Pick<ExperimentFormHandlers, 'handleTagsChange' | 'handleOutputsChange' | 'handleInputChange'> & {
  experiment: ExperimentFormData;
};

export default function AdvancedSettingsTab({ experiment, handleTagsChange, handleOutputsChange, handleInputChange }: AdvancedSettingsTabProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.form.advanced.cardTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium">{t('admin.form.advanced.searchTagsLabel')}</Label>
              <Input 
                value={(experiment.tags || []).join(', ')} 
                onChange={e => handleTagsChange(e.target.value)}
                placeholder={t('admin.form.advanced.searchTagsPlaceholder')}
              />
              <p className="text-xs text-slate-500 mt-1">
                {t('admin.form.advanced.searchTagsHint')}
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">{t('admin.form.advanced.outputsLabel')}</Label>
              <Input 
                value={(experiment.outputs || []).join(', ')} 
                onChange={e => handleOutputsChange(e.target.value)}
                placeholder="position, velocity, energy_total"
              />
              <p className="text-xs text-slate-500 mt-1">
                {t('admin.form.advanced.outputsHint')}
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">{t('admin.form.advanced.thumbnailUrlLabel')}</Label>
              <Input 
                value={experiment.thumbnail_url || ''} 
                onChange={e => handleInputChange('thumbnail_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.form.advanced.previewCardTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ExperimentPreviewCard experiment={experiment} />
          </CardContent>
        </Card>
      </div>

      <RawJsonViewer experiment={experiment} />
    </>
  );
}
