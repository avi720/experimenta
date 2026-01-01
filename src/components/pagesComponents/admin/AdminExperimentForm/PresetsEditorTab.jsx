import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function PresetsEditorTab({ 
  experiment, 
  presetTextValues, 
  handlePresetValuesChange, 
  handleDynamicArrayChange,
  addToArray, 
  removeFromArray 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>תבניות מוכנות</CardTitle>
        <CardDescription>
          הגדר תבניות של פרמטרים כדי לאפשר למשתמשים לטעון הגדרות מוכנות.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {experiment.presets?.map((preset, index) => (
          <motion.div 
            key={index}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border rounded-lg space-y-4 bg-green-50 relative"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold">תבנית #{index + 1}</h4>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => removeFromArray('presets', index)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>שם התבנית בעברית</Label>
                <Input 
                  value={preset.name_he || ''} 
                  onChange={e => handleDynamicArrayChange('presets', index, 'name_he', e.target.value)}
                  placeholder="טיפה מבניין"
                />
              </div>
              <div>
                <Label>שם התבנית באנגלית</Label>
                <Input 
                  value={preset.name_en || ''} 
                  onChange={e => handleDynamicArrayChange('presets', index, 'name_en', e.target.value)}
                  placeholder="Drop from Building"
                />
              </div>
            </div>

            <div>
              <Label>ערכי הפרמטרים (JSON)</Label>
              <Textarea 
                value={presetTextValues[index] || JSON.stringify(preset.values || {}, null, 2)} 
                onChange={e => handlePresetValuesChange(index, e.target.value)}
                placeholder='{"h0": 50, "g": 9.81, "m": 1}'
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                הזן את ערכי הפרמטרים בפורמט JSON. השתמש במפתחות הפרמטרים שהגדרת למעלה.
              </p>
              {(() => {
                try {
                  JSON.parse(presetTextValues[index] || '{}');
                  return null;
                } catch (err) {
                  return (
                    <p className="text-xs text-red-500 mt-1">
                      פורמט JSON לא תקין - התבנית לא תישמר עד לתיקון
                    </p>
                  );
                }
              })()}
            </div>
          </motion.div>
        ))}
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => addToArray('presets', { 
            name_he: '', 
            name_en: '', 
            values: {} 
          })}
          className="w-full h-16 text-lg"
        >
          <PlusCircle className="ml-2 h-5 w-5" />
          הוסף תבנית חדשה
        </Button>
      </CardContent>
    </Card>
  );
}