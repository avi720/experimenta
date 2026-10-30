import I18nTextInput from './I18nTextInput';
import I18nStepsEditor from './I18nStepsEditor';
import FormSection from './FormSection';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors } from '@/types/admin';
import type { ExperimentFormData } from '@/types/experiment';

type ContentEditorTabProps = Pick<ExperimentFormHandlers, 'handleI18nChange' | 'handleI18nStepsChange' | 'addI18nStep' | 'removeI18nStep'> & {
  experiment: ExperimentFormData;
  errors: FormErrors;
};

const localeTag = (code: string) => (
  <span className="rounded-full border border-line px-2 py-px font-mono text-[11px] text-dust">{code}</span>
);

export default function ContentEditorTab({ experiment, handleI18nChange, handleI18nStepsChange, addI18nStep, removeI18nStep, errors }: ContentEditorTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-10">
      {/* Title */}
      <FormSection title={t('admin.form.content.titleCard')}>
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
      </FormSection>

      {/* Short Description */}
      <FormSection title={t('admin.form.content.shortDescCard')}>
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
      </FormSection>

      {/* Steps */}
      <FormSection title={t('admin.form.content.stepsCard')}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-sm font-medium text-star">{t('admin.form.content.hebrewHeading')}</h3>
              {localeTag('HE')}
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
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-sm font-medium text-star">{t('admin.form.content.englishHeading')}</h3>
              {localeTag('EN')}
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
      </FormSection>

      {/* Safety Notes */}
      <FormSection title={t('admin.form.content.safetyCard')}>
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
      </FormSection>
    </div>
  );
}
