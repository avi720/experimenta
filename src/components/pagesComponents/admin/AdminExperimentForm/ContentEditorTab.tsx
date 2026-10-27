import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import I18nTextInput from './I18nTextInput';
import I18nStepsEditor from './I18nStepsEditor';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/components/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors } from '@/types/admin';
import type { ExperimentFormData } from '@/types/experiment';

type ContentEditorTabProps = Pick<ExperimentFormHandlers, 'handleI18nChange' | 'handleI18nStepsChange' | 'addI18nStep' | 'removeI18nStep'> & {
  experiment: ExperimentFormData;
  errors: FormErrors;
};

export default function ContentEditorTab({ experiment, handleI18nChange, handleI18nStepsChange, addI18nStep, removeI18nStep, errors }: ContentEditorTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.form.content.titleCard')}</CardTitle>
        </CardHeader>
        <CardContent>
          <I18nTextInput
            field="title"
            experiment={experiment}
            handleI18nChange={handleI18nChange}
            errors={errors}
            labelHe={t('admin.form.content.titleHe')}
            labelEn={t('admin.form.content.titleEn')}
            placeholderHe={t('admin.form.content.titlePlaceholderHe')}
            placeholderEn={t('admin.form.content.titlePlaceholderEn')}
            required={true}
          />
        </CardContent>
      </Card>

      {/* Short Description */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.form.content.shortDescCard')}</CardTitle>
        </CardHeader>
        <CardContent>
          <I18nTextInput
            field="short_desc"
            experiment={experiment}
            handleI18nChange={handleI18nChange}
            errors={errors}
            type="textarea"
            labelHe={t('admin.form.content.shortDescHe')}
            labelEn={t('admin.form.content.shortDescEn')}
            placeholderHe={t('admin.form.content.shortDescPlaceholderHe')}
            placeholderEn={t('admin.form.content.shortDescPlaceholderEn')}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.form.content.stepsCard')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CardTitle className="text-base">{t('admin.form.content.hebrewHeading')}</CardTitle>
                <Badge>HE</Badge>
              </div>
              <I18nStepsEditor
                locale="he"
                steps={experiment.i18n_texts?.he?.steps || []}
                handleI18nStepsChange={handleI18nStepsChange}
                addI18nStep={addI18nStep}
                removeI18nStep={removeI18nStep}
                label={t('admin.form.content.stepsLabelHe')}
                placeholder={t('admin.form.content.stepPlaceholderHe')}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <CardTitle className="text-base">{t('admin.form.content.englishHeading')}</CardTitle>
                <Badge>EN</Badge>
              </div>
              <I18nStepsEditor
                locale="en"
                steps={experiment.i18n_texts?.en?.steps || []}
                handleI18nStepsChange={handleI18nStepsChange}
                addI18nStep={addI18nStep}
                removeI18nStep={removeI18nStep}
                label={t('admin.form.content.stepsLabelEn')}
                placeholder={t('admin.form.content.stepPlaceholderEn')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.form.content.safetyCard')}</CardTitle>
        </CardHeader>
        <CardContent>
          <I18nTextInput
            field="safety_notes"
            experiment={experiment}
            handleI18nChange={handleI18nChange}
            errors={errors}
            type="textarea"
            labelHe={t('admin.form.content.safetyHe')}
            labelEn={t('admin.form.content.safetyEn')}
            placeholderHe={t('admin.form.content.safetyPlaceholderHe')}
            placeholderEn={t('admin.form.content.safetyPlaceholderEn')}
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
