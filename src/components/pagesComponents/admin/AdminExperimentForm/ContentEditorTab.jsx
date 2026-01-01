import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import I18nTextInput from './I18nTextInput';
import I18nStepsEditor from './I18nStepsEditor';

export default function ContentEditorTab({ experiment, handleI18nChange, handleI18nStepsChange, addI18nStep, removeI18nStep, errors }) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle>כותרת הניסוי</CardTitle>
        </CardHeader>
        <CardContent>
          <I18nTextInput
            field="title"
            experiment={experiment}
            handleI18nChange={handleI18nChange}
            errors={errors}
            labelHe="כותרת"
            labelEn="Title"
            placeholderHe="נפילה חופשית"
            placeholderEn="Free Fall"
            required={true}
          />
        </CardContent>
      </Card>

      {/* Short Description */}
      <Card>
        <CardHeader>
          <CardTitle>תיאור קצר</CardTitle>
        </CardHeader>
        <CardContent>
          <I18nTextInput
            field="short_desc"
            experiment={experiment}
            handleI18nChange={handleI18nChange}
            errors={errors}
            type="textarea"
            labelHe="תיאור קצר"
            labelEn="Short Description"
            placeholderHe="תיאור קצר של הניסוי..."
            placeholderEn="Brief description of the experiment..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>שלבי הניסוי</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CardTitle className="text-base">עברית</CardTitle>
                <Badge>HE</Badge>
              </div>
              <I18nStepsEditor
                locale="he"
                steps={experiment.i18n_texts?.he?.steps || []}
                handleI18nStepsChange={handleI18nStepsChange}
                addI18nStep={addI18nStep}
                removeI18nStep={removeI18nStep}
                label="שלבי הניסוי"
                placeholder="שלב"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <CardTitle className="text-base">English</CardTitle>
                <Badge>EN</Badge>
              </div>
              <I18nStepsEditor
                locale="en"
                steps={experiment.i18n_texts?.en?.steps || []}
                handleI18nStepsChange={handleI18nStepsChange}
                addI18nStep={addI18nStep}
                removeI18nStep={removeI18nStep}
                label="Experiment Steps"
                placeholder="Step"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Notes */}
      <Card>
        <CardHeader>
          <CardTitle>הערות בטיחות</CardTitle>
        </CardHeader>
        <CardContent>
          <I18nTextInput
            field="safety_notes"
            experiment={experiment}
            handleI18nChange={handleI18nChange}
            errors={errors}
            type="textarea"
            labelHe="הערות בטיחות"
            labelEn="Safety Notes"
            placeholderHe="הערות בטיחות חשובות..."
            placeholderEn="Important safety notes..."
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}