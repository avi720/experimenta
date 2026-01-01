import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function ExperimentFormFloatingSaveButton({ isSaving, handleSubmit, hasChanges, isEditMode }) {
  return (
    <Button
      type="submit"
      onClick={handleSubmit}
      disabled={isSaving || (!hasChanges && isEditMode)}
      className="fixed bottom-8 left-8 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 w-14 h-14 p-0 disabled:opacity-50"
    >
      <Save className="w-6 h-6" />
    </Button>
  );
}