import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function SelectParameterOptionsEditor({ 
  param, 
  index, 
  handleDynamicArrayChange,
  handleNestedDynamicChange, 
  addNestedToArray, 
  removeNestedFromArray, 
  errors 
}) {
  const options = param.options || [];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">אפשרויות בחירה</Label>
        <div className="space-y-2 mt-2">
          {options.map((option, optIndex) => (
            <div key={optIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-slate-50 rounded">
              <Input
                placeholder="ערך"
                value={option.value || ''}
                onChange={e => handleNestedDynamicChange('parameters', index, 'options', optIndex, 'value', e.target.value)}
              />
              <Input
                placeholder="תווית בעברית"
                value={option.label_he || ''}
                onChange={e => handleNestedDynamicChange('parameters', index, 'options', optIndex, 'label_he', e.target.value)}
              />
              <Input
                placeholder="Label in English"
                value={option.label_en || ''}
                onChange={e => handleNestedDynamicChange('parameters', index, 'options', optIndex, 'label_en', e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeNestedFromArray('parameters', index, 'options', optIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={() => addNestedToArray('parameters', index, 'options', { value: '', label_he: '', label_en: '' })}
        >
          <PlusCircle className="ml-2 h-4 w-4" />
          הוסף אפשרות
        </Button>
      </div>

      <div>
        <Label>ערך ברירת מחדל</Label>
        <Select
          value={param.default || ''}
          onValueChange={val => handleDynamicArrayChange('parameters', index, 'default', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="בחר ערך ברירת מחדל" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option, optIndex) => (
              <SelectItem key={optIndex} value={option.value || ''}>
                {option.label_he || option.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors[`param_${index}_default`] && (
          <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_default`]}</p>
        )}
      </div>
    </div>
  );
}