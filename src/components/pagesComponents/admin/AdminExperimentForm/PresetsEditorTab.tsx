import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import FormSection from './FormSection';
import {
  dangerIconButtonClass,
  fieldErrorClass,
  fieldHintClass,
  fieldLabelClass,
  inputErrorClass,
  panelClass,
  secondaryButtonClass,
} from '../adminStyles';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { FormErrors, PresetTextValues } from '@/types/admin';
import type { ExperimentFormData } from '@/types/experiment';

type PresetsEditorTabProps = Pick<ExperimentFormHandlers, 'handleDynamicArrayChange' | 'addToArray' | 'removeFromArray'> & {
  experiment: ExperimentFormData;
  presetTextValues: PresetTextValues;
  handlePresetValuesChange: (index: number, textValue: string) => void;
  errors?: FormErrors;
};

export default function PresetsEditorTab({
  experiment,
  presetTextValues,
  handlePresetValuesChange,
  handleDynamicArrayChange,
  addToArray,
  removeFromArray,
  errors = {}
}: PresetsEditorTabProps) {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t('admin.form.presets.cardTitle')}
      description={t('admin.form.presets.cardDescription')}
      aside={<span className="font-mono text-sm tabular-nums text-dust">{experiment.presets?.length || 0}</span>}
    >
      <div className="space-y-4">
        {experiment.presets?.map((preset, index) => {
          const rawValue =
            index in presetTextValues
              ? presetTextValues[index]
              : JSON.stringify(preset.values || {}, null, 2);

          let liveParseError: string | null = null;
          if (!rawValue.trim()) {
            liveParseError = t('admin.form.validation.presetJsonSyntaxError');
          } else {
            try {
              const parsed: unknown = JSON.parse(rawValue);
              if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                liveParseError = t('admin.form.validation.presetJsonObjectRequired');
              }
            } catch {
              liveParseError = t('admin.form.validation.presetJsonSyntaxError');
            }
          }

          const errorMessage = errors[`preset_${index}_values`] || liveParseError;
          const jsonId = `preset-${index}-values`;

          return (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={panelClass}
            >
              <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
                <h3 className="min-w-0 flex-1 truncate text-[15px] font-medium text-star">
                  {t('admin.form.presets.presetItemTitle', { index: index + 1 })}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={dangerIconButtonClass}
                  onClick={() => removeFromArray('presets', index)}
                  aria-label={`${t('admin.form.removePreset')} ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-5 px-4 py-5 sm:px-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`preset-${index}-name-he`} className={fieldLabelClass}>{t('admin.form.presets.nameHeLabel')}</Label>
                    <Input
                      id={`preset-${index}-name-he`}
                      dir="rtl"
                      lang="he"
                      value={preset.name_he || ''}
                      onChange={e => handleDynamicArrayChange('presets', index, 'name_he', e.target.value)}
                      placeholder={t('admin.form.presets.nameHePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`preset-${index}-name-en`} className={fieldLabelClass}>{t('admin.form.presets.nameEnLabel')}</Label>
                    <Input
                      id={`preset-${index}-name-en`}
                      dir="ltr"
                      lang="en"
                      value={preset.name_en || ''}
                      onChange={e => handleDynamicArrayChange('presets', index, 'name_en', e.target.value)}
                      placeholder={t('admin.form.presets.nameEnPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={jsonId} className={fieldLabelClass}>{t('admin.form.presets.valuesJsonLabel')}</Label>
                  <Textarea
                    id={jsonId}
                    dir="ltr"
                    spellCheck={false}
                    value={rawValue}
                    onChange={e => handlePresetValuesChange(index, e.target.value)}
                    placeholder='{"h0": 50, "g": 9.81, "m": 1}'
                    rows={4}
                    aria-invalid={Boolean(errorMessage)}
                    className={`bg-hole/50 font-mono text-[13px] leading-relaxed text-star ${errorMessage ? inputErrorClass : ''}`}
                  />
                  <p className={fieldHintClass}>
                    {t('admin.form.presets.valuesJsonHint')}
                  </p>
                  {errorMessage && (
                    <p className={fieldErrorClass} role="alert">
                      {errorMessage}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() => addToArray('presets', {
            name_he: '',
            name_en: '',
            values: {}
          })}
          className={`${secondaryButtonClass} h-12 w-full border-dashed`}
        >
          <Plus className="h-4 w-4" />
          {t('admin.form.presets.addPreset')}
        </Button>
      </div>
    </FormSection>
  );
}
