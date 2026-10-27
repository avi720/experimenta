import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { ExperimentFormHandlers } from '@/hooks/experimentForm/useExperimentFormHandlers';
import type { Locale } from '@/types/experiment';

type I18nStepsEditorProps = Pick<ExperimentFormHandlers, 'handleI18nStepsChange' | 'addI18nStep' | 'removeI18nStep'> & {
  locale: Locale;
  steps: string[];
  label: string;
  placeholder: string;
};

export default function I18nStepsEditor({ 
  locale, 
  steps, 
  handleI18nStepsChange, 
  addI18nStep, 
  removeI18nStep,
  label,
  placeholder 
}: I18nStepsEditorProps) {
  const { t } = useTranslation();

  return (
    <div>
      <Label className="text-base font-medium">{label}</Label>
      {(steps || []).map((step, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <Input
            value={step}
            onChange={(e) => handleI18nStepsChange(locale, index, e.target.value)}
            placeholder={`${placeholder} ${index + 1}`}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => removeI18nStep(locale, index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => addI18nStep(locale)}
        className="w-full"
      >
        <PlusCircle className="me-2 h-4 w-4" />
        {t(locale === 'he' ? 'admin.form.content.addStepHe' : 'admin.form.content.addStepEn')}
      </Button>
    </div>
  );
}
