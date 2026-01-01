import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function RawJsonViewer({ experiment }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>תצוגת JSON גולמית</CardTitle>
        <CardDescription>
          תצוגה של הנתונים בפורמט JSON. שימושי לבדיקה ולהעתקה.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea 
          value={JSON.stringify(experiment, null, 2)} 
          readOnly
          rows={12}
          className="font-mono text-xs bg-slate-50"
        />
      </CardContent>
    </Card>
  );
}