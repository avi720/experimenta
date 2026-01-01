import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function I18nTextInput({ 
  field, 
  experiment, 
  handleI18nChange, 
  errors, 
  type = 'input', 
  labelHe, 
  labelEn, 
  placeholderHe, 
  placeholderEn,
  rows = 3,
  required = false
}) {
  const InputComponent = type === 'textarea' ? Textarea : Input;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Hebrew */}
      <div>
        <Label className="text-base font-medium">
          {labelHe} {required && '*'}
        </Label>
        <InputComponent
          value={experiment.i18n_texts?.he?.[field] || ''} 
          onChange={e => handleI18nChange('he', field, e.target.value)}
          placeholder={placeholderHe}
          className={errors[`${field}_he`] ? 'border-red-500' : ''}
          rows={type === 'textarea' ? rows : undefined}
        />
        {errors[`${field}_he`] && (
          <p className="text-red-500 text-sm mt-1">{errors[`${field}_he`]}</p>
        )}
      </div>

      {/* English */}
      <div>
        <Label className="text-base font-medium">
          {labelEn} {required && '*'}
        </Label>
        <InputComponent
          value={experiment.i18n_texts?.en?.[field] || ''} 
          onChange={e => handleI18nChange('en', field, e.target.value)}
          placeholder={placeholderEn}
          className={errors[`${field}_en`] ? 'border-red-500' : ''}
          rows={type === 'textarea' ? rows : undefined}
        />
        {errors[`${field}_en`] && (
          <p className="text-red-500 text-sm mt-1">{errors[`${field}_en`]}</p>
        )}
      </div>
    </div>
  );
}