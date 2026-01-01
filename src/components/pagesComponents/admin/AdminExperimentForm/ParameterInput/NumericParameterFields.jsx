import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NumericParameterFields({ 
  param, 
  index, 
  handleDynamicArrayChange, 
  errors 
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <Label>ערך ברירת מחדל *</Label>
        <Input
          type="text"
          value={param.default}
          onChange={e => handleDynamicArrayChange('parameters', index, 'default', e.target.value)}
          className={errors[`param_${index}_default`] ? 'border-red-500' : ''}
        />
        {errors[`param_${index}_default`] && (
          <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_default`]}</p>
        )}
      </div>

      <div>
        <Label>מינימום</Label>
        <Input
          type="text"
          value={param.min}
          onChange={e => handleDynamicArrayChange('parameters', index, 'min', e.target.value)}
          className={errors[`param_${index}_min`] ? 'border-red-500' : ''}
        />
        {errors[`param_${index}_min`] && (
          <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_min`]}</p>
        )}
      </div>

      <div>
        <Label>מקסימום</Label>
        <Input
          type="text"
          value={param.max}
          onChange={e => handleDynamicArrayChange('parameters', index, 'max', e.target.value)}
          className={errors[`param_${index}_max`] ? 'border-red-500' : ''}
        />
        {errors[`param_${index}_max`] && (
          <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_max`]}</p>
        )}
      </div>

      <div>
        <Label>צעד (Step)</Label>
        <Input
          type="text"
          value={param.step}
          onChange={e => handleDynamicArrayChange('parameters', index, 'step', e.target.value)}
          className={errors[`param_${index}_step`] ? 'border-red-500' : ''}
        />
        {errors[`param_${index}_step`] && (
          <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_step`]}</p>
        )}
      </div>
    </div>
  );
}