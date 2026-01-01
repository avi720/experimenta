import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ExperimentPreviewCard from './ExperimentPreviewCard';
import RawJsonViewer from './RawJsonViewer';

export default function AdvancedSettingsTab({ experiment, handleTagsChange, handleOutputsChange, handleInputChange }) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>הגדרות מתקדמות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium">תגיות חיפוש</Label>
              <Input 
                value={(experiment.tags || []).join(', ')} 
                onChange={e => handleTagsChange(e.target.value)}
                placeholder="פיזיקה, מכניקה, נפילה, כבידה"
              />
              <p className="text-xs text-slate-500 mt-1">
                הפרד תגיות בפסיק. יעזרו למשתמשים למצוא את הניסוי בחיפוש.
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">פלטי מדידה</Label>
              <Input 
                value={(experiment.outputs || []).join(', ')} 
                onChange={e => handleOutputsChange(e.target.value)}
                placeholder="position, velocity, energy_total"
              />
              <p className="text-xs text-slate-500 mt-1">
                רשימת הנתונים שהמנוע מחזיר ויוצגו בגרפים ובקונסולה. לדוגמה: `position.y, velocity.y`
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">תמונה ממוזערת (URL)</Label>
              <Input 
                value={experiment.thumbnail_url || ''} 
                onChange={e => handleInputChange('thumbnail_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>תצוגה מקדימה</CardTitle>
          </CardHeader>
          <CardContent>
            <ExperimentPreviewCard experiment={experiment} />
          </CardContent>
        </Card>
      </div>

      <RawJsonViewer experiment={experiment} />
    </>
  );
}