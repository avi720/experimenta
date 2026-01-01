import React from 'react';
import { Badge } from '@/components/ui/badge';
import { categoryOptions, /*engineOptions*/ } from './adminFormConstants';

export default function ExperimentPreviewCard({ experiment }) {
  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {experiment.i18n_texts?.he?.title || 'ללא כותרת'}
        </h3>
        <div className="flex gap-2">
          <Badge>{categoryOptions.find(c => c.value === experiment.category)?.label}</Badge>
        </div>
      </div>
      
      <p className="text-slate-600">
        {experiment.i18n_texts?.he?.short_desc || 'אין תיאור'}
      </p>
      
      <div className="flex flex-wrap gap-1">
        {(experiment.tags || []).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            #{tag}
          </Badge>
        ))}
      </div>
      
      <div className="text-sm text-slate-500">
        {/*<div>מנוע: {engineOptions.find(e => e.value === experiment.engine)?.label}</div>*/}
        <div>פרמטרים: {experiment.parameters?.length || 0}</div>
        <div>תבניות: {experiment.presets?.length || 0}</div>
      </div>
    </div>
  );
}