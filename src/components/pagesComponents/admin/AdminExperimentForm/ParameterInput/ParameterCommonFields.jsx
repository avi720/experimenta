import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { parameterTypes } from '../adminFormConstants';

export default function ParameterCommonFields({ 
  param, 
  index, 
  handleDynamicArrayChange, 
  errors 
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>מפתח (Key) *</Label>
          <Input
            value={param.key}
            onChange={e => handleDynamicArrayChange('parameters', index, 'key', e.target.value)}
            placeholder="mass, velocity, amplitude"
            className={errors[`param_${index}_key`] ? 'border-red-500' : ''}
          />
          {errors[`param_${index}_key`] && (
            <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_key`]}</p>
          )}
        </div>

        <div>
          <Label>סוג נתונים *</Label>
          <Select
            value={param.type}
            onValueChange={val => handleDynamicArrayChange('parameters', index, 'type', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {parameterTypes.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>יחידה</Label>
          <Input
            value={param.unit || ''}
            onChange={e => handleDynamicArrayChange('parameters', index, 'unit', e.target.value)}
            placeholder="m, kg, m/s"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-4">
        <Switch
          checked={param.is_active !== false}
          onCheckedChange={val => handleDynamicArrayChange('parameters', index, 'is_active', val)}
        />
        <Label>פרמטר פעיל</Label>
      </div>
    </>
  );
}