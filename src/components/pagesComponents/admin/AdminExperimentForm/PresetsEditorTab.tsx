import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/components/hooks/experimentForm/useExperimentFormHandlers';
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
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.form.presets.cardTitle')}</CardTitle>
        <CardDescription>
          {t('admin.form.presets.cardDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

          return (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 border rounded-lg space-y-4 bg-green-50 relative"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">
                  {t('admin.form.presets.presetItemTitle', { index: index + 1 })}
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromArray('presets', index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('admin.form.presets.nameHeLabel')}</Label>
                  <Input
                    value={preset.name_he || ''}
                    onChange={e => handleDynamicArrayChange('presets', index, 'name_he', e.target.value)}
                    placeholder={t('admin.form.presets.nameHePlaceholder')}
                  />
                </div>
                <div>
                  <Label>{t('admin.form.presets.nameEnLabel')}</Label>
                  <Input
                    value={preset.name_en || ''}
                    onChange={e => handleDynamicArrayChange('presets', index, 'name_en', e.target.value)}
                    placeholder={t('admin.form.presets.nameEnPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <Label>{t('admin.form.presets.valuesJsonLabel')}</Label>
                <Textarea
                  value={rawValue}
                  onChange={e => handlePresetValuesChange(index, e.target.value)}
                  placeholder='{"h0": 50, "g": 9.81, "m": 1}'
                  rows={4}
                  aria-invalid={Boolean(errorMessage)}
                  className={`font-mono text-sm ${errorMessage ? 'border-red-500' : ''}`}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {t('admin.form.presets.valuesJsonHint')}
                </p>
                {errorMessage && (
                  <p className="text-xs text-red-500 mt-1" role="alert">
                    {errorMessage}
                  </p>
                )}
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
          className="w-full h-16 text-lg"
        >
          <PlusCircle className="me-2 h-5 w-5" />
          {t('admin.form.presets.addPreset')}
        </Button>
      </CardContent>
    </Card>
  );
}
