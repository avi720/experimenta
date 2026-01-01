
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
// The original emptyParameter import is removed as its content is now inlined in the addToArray call.
import ParameterInput from './ParameterInput/ParameterInput';

export default function ParametersEditorTab({ 
  experiment, 
  handleDynamicArrayChange, 
  handleNestedDynamicChange,
  addToArray, 
  addNestedToArray, 
  removeNestedFromArray, 
  removeFromArray, 
  errors 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>פרמטרים</CardTitle>
        <CardDescription>הגדרת פרמטרי הניסוי שניתן לשנות בזמן ריצה</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(experiment.parameters || []).map((param, index) => (
          <ParameterInput
            key={index} // Key moved directly to ParameterInput
            param={param}
            index={index}
            handleDynamicArrayChange={handleDynamicArrayChange}
            handleNestedDynamicChange={handleNestedDynamicChange}
            addNestedToArray={addNestedToArray}
            removeNestedFromArray={removeNestedFromArray}
            removeFromArray={removeFromArray} // New prop passed to ParameterInput
            errors={errors}
          />
        ))}
        
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" // className simplified
          onClick={() => addToArray('parameters', {
            key: '',
            type: 'float',
            unit: '',
            default: '0',
            min: '0',
            max: '100',
            step: '0.1',
            options: [],
            i18n_labels: { he: '', en: '' },
            tooltip: { he: '', en: '' },
            is_active: true
          })}
        >
          <PlusCircle className="ml-2 h-5 w-5" /> {/* Corrected className from h-5 h-5 to h-5 w-5 */}
          הוסף פרמטר חדש
        </Button>
      </CardContent>
    </Card>
  );
}
