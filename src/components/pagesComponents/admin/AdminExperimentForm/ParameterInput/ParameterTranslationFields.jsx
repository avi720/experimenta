import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ParameterTranslationFields({ 
  param, 
  index, 
  handleNestedDynamicChange 
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>תווית בעברית *</Label>
          <Input
            value={param.i18n_labels?.he || ''}
            onChange={e => handleNestedDynamicChange('parameters', index, 'i18n_labels', null, 'he', e.target.value)}
            placeholder="מסה, מהירות, משרעת"
          />
        </div>
        <div>
          <Label>Label in English *</Label>
          <Input
            value={param.i18n_labels?.en || ''}
            onChange={e => handleNestedDynamicChange('parameters', index, 'i18n_labels', null, 'en', e.target.value)}
            placeholder="Mass, Velocity, Amplitude"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>הסבר בעברית (Tooltip)</Label>
          <Input
            value={param.tooltip?.he || ''}
            onChange={e => handleNestedDynamicChange('parameters', index, 'tooltip', null, 'he', e.target.value)}
            placeholder="הסבר קצר על הפרמטר"
          />
        </div>
        <div>
          <Label>Explanation in English (Tooltip)</Label>
          <Input
            value={param.tooltip?.en || ''}
            onChange={e => handleNestedDynamicChange('parameters', index, 'tooltip', null, 'en', e.target.value)}
            placeholder="Brief explanation of the parameter"
          />
        </div>
      </div>
    </div>
  );
}