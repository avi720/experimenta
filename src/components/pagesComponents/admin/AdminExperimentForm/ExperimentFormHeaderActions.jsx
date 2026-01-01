import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Save, Eye, FileDown } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function ExperimentFormHeaderActions({ 
  isEditMode, 
  experiment, 
  exportExperiment, 
  navigate, 
  isSaving,
  hasChanges 
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {isEditMode ? 'עריכת ניסוי' : 'יצירת ניסוי חדש'}
        </h1>
        {experiment.slug && (
          <Badge variant="outline" className="text-sm">
            {experiment.slug}
          </Badge>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={exportExperiment}
          className="gap-2"
        >
          <FileDown className="w-4 h-4" />
          ייצוא JSON
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => window.open(`/lab?experiment=${experiment.slug}`, '_blank')}
          disabled={!experiment.slug}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          תצוגה מקדימה
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(createPageUrl('AdminExperiments'))}
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה
        </Button>

        <Button
          type="submit"
          disabled={isSaving || (!hasChanges && isEditMode)}
          className="bg-blue-600 hover:bg-blue-700 gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'שומר...' : 'שמור'}
        </Button>
      </div>
    </div>
  );
}