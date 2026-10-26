import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function ExperimentFormFloatingSaveButton({ isSaving, hasChanges, isEditMode }) {
  const { t } = useTranslation();

  return (
    <Button
      type="submit"
      disabled={isSaving || (!hasChanges && isEditMode)}
      aria-label={t('common.save')}
      className="fixed bottom-8 left-8 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 w-14 h-14 p-0 disabled:opacity-50"
    >
      <Save className="w-6 h-6" />
    </Button>
  );
}
