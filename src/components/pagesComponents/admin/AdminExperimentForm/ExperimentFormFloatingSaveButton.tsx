import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useTranslation } from '@/i18n';

type ExperimentFormFloatingSaveButtonProps = {
  isSaving: boolean;
  hasChanges: boolean;
  isEditMode: boolean;
};

export default function ExperimentFormFloatingSaveButton({ isSaving, hasChanges, isEditMode }: ExperimentFormFloatingSaveButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="submit"
      disabled={isSaving || (!hasChanges && isEditMode)}
      aria-label={t('common.save')}
      className="focus-ring fixed bottom-6 start-6 z-30 h-14 w-14 rounded-full bg-plasma p-0 text-[#1C0F04] shadow-[0_0_0_1px_rgb(var(--plasma-hi)/0.4),0_12px_32px_-8px_rgb(var(--plasma)/0.45)] hover:bg-plasma-hi disabled:opacity-0 disabled:pointer-events-none transition-opacity"
    >
      <Save className="w-6 h-6" />
    </Button>
  );
}
