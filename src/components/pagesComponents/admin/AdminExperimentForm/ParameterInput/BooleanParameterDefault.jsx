import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/i18n';

export default function BooleanParameterDefault({ 
  param, 
  index, 
  handleDynamicArrayChange 
}) {
  const { t } = useTranslation();

  return (
    <div>
      <Label>{t('admin.form.parameters.defaultValueLabel')}</Label>
      <Select
        value={String(param.default)}
        onValueChange={val => handleDynamicArrayChange('parameters', index, 'default', val)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">{t('admin.form.parameters.boolTrue')}</SelectItem>
          <SelectItem value="false">{t('admin.form.parameters.boolFalse')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
