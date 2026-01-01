import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BooleanParameterDefault({ 
  param, 
  index, 
  handleDynamicArrayChange 
}) {
  return (
    <div>
      <Label>ערך ברירת מחדל</Label>
      <Select
        value={String(param.default)}
        onValueChange={val => handleDynamicArrayChange('parameters', index, 'default', val)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">אמת (True)</SelectItem>
          <SelectItem value="false">שקר (False)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}