import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function I18nStepsEditor({ 
  locale, 
  steps, 
  handleI18nStepsChange, 
  addI18nStep, 
  removeI18nStep,
  label,
  placeholder 
}) {
  return (
    <div>
      <Label className="text-base font-medium">{label}</Label>
      {(steps || []).map((step, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <Input
            value={step}
            onChange={(e) => handleI18nStepsChange(locale, index, e.target.value)}
            placeholder={`${placeholder} ${index + 1}`}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => removeI18nStep(locale, index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => addI18nStep(locale)}
        className="w-full"
      >
        <PlusCircle className="ml-2 h-4 w-4" />
        {locale === 'he' ? 'הוסף שלב' : 'Add Step'}
      </Button>
    </div>
  );
}